#!/usr/bin/env node


const Cortex                = require('ion-cortex');
const chalk                 = require("chalk");
const figlet                = require("figlet");
const _progress             = require('cli-progress');
const colors                = require('ansi-colors');
const questions             = require('./questions')()
const BuilderSSH            = require('./services/BuilderSSH')
const config                = require('./config/index.config')
class Floki {
    constructor({questions}){
        
        /** init cortex */
        this.questions  = questions
        this.cortex     = null
        this.type       = ""
        
        this._init()
    }
    _success(msg) {
        console.log(
            chalk.whiteBright.bgMagenta.bold(msg)
        );
    }

    _failure(msg){
        console.log(
            chalk.whiteBright.bgRed.bold(msg)
        );
    }

    _warning(msg){
        console.log(
            chalk.whiteBright.bgYellow.bold(msg)
        );
    }

    _info(msg){
        console.log(
            chalk.whiteBright.bgMagenta.bold(msg)
        );
    }

    async _cortexConnect (uri, prefix){
        this.cortex = new Cortex({
            prefix: prefix,
            url: uri,
            type: 'flokey',
            state: ()=>{
                return {} 
            },
            activeDelay: 1000,
            idlDelay: 1000,
        });

    }

    async _emitToAllOfCb(type, call, args){
        let nodes = []
        return await new Promise((resolve, reject) => {
            let nodeCount = 0
            let errorNodes = 0
            let successNodes = 0
            console.log(args)
            this.cortex.emitToAllOf({type, call, args}, (data) => {
                nodeCount++
                let hostname = data.hostname
                if(data.error){
                    errorNodes++
                    nodes.push({hostname, result:'Failed to update.. ❌', error:data.error})
                } 
                if(data.msg){
                    successNodes++
                    nodes.push({hostname, result:'Succesfully updated.. ✅', msg:data.msg})
                } 
                if(nodeCount === Object.keys(this.cortex.nodes[type]).length){
                    resolve({affected:[errorNodes, successNodes], nodes:nodes})
                }
            })
        })
    }

    _waitForCortex(onComplete){
        console.log('\nWating for Cortex to load.. (2s)');
        // create new progress bar using default values
        const progressBar = new _progress.SingleBar
        ({
            format: colors.cyan('[{bar}]'),
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
        }, _progress.Presets.shades_classic);
        progressBar.start(2, 0);
    
        // the bar value - will be linear incremented
        let value = 0;
    
        // 20ms update rate
        const timer = setInterval(function(){
            // increment value
            value++
    
            // update the bar value
            progressBar.update(value)
    
            // set limit
            if (value >= progressBar.getTotal()){
                // stop timer
                clearInterval(timer);
    
                progressBar.stop();
    
                // run complete callback
                onComplete.apply(this);
            }
        }, 2000);
    }

    async _init(){
        console.log(
          chalk.green(
            figlet.textSync("FLOKEY", {
            //   font: "Ghost",
              horizontalLayout: "default",
              verticalLayout: "default",
            })
          )
        );
        this._startSequence()
    };


    async _startSequence(){
        await this._connect()
        setTimeout(async () => {
            await this._waitForCortex(async () =>{
                await this._operationStart()
            })
            // await
        }, 1000);
    }

    async _connect(){
        if(config.dotEnv.CORTEX_REDIS && config.dotEnv.CORTEX_PREFIX){
            await this._cortexConnect(config.dotEnv.CORTEX_REDIS, config.dotEnv.CORTEX_PREFIX)
        } else {
            const { redisURI }      = await this.questions.redisURIQuestion()
            const { cortexPrefix }  = await this.questions.cortexPrefixQuestion()
            await this._cortexConnect(redisURI, cortexPrefix)
        }
        
        this.builder            = new BuilderSSH({cortex:this.cortex})

    }

    async _operationStart(){
        const { operationMode } = await this.questions.operationModeQuestion()
        if(operationMode === 0){
            const { operationType }    = await this.questions.operationTypeQuestion()
            const { NODE } = await this.questions.nodesQuestion(this.cortex)
            this.type = `${NODE}_minion`
            if(operationType === 0){
                await this._envModeOperation()
            }else if(operationType === 1){
                await this._remoteExecutionOperation()
            }
        } else if(operationMode === 1){
            const { HOST } = await this.questions.hostsQuestion(this.builder)
            let hostId = HOST.split('@')[0].trim()
            if(config.dotEnv.SSH_UER === 'root') this._info(`Please be advised that ssh connection will be initiated with default user 'root', if you want to change it provide it in the env file (SSH_USER)`)
            await this.builder.connect(hostId)
            this._info(`Please type exit to leave cmd mode.`)
            await this.sessionBuilder(hostId)
        }

        await this._restartOperation()
    }

    async sessionBuilder(hostId){
        const { CMD } = await this.questions.cmdQuestion(hostId)
        if(CMD.trim() === 'exit') return
        let msg  = await this.builder.checkCommand(hostId, CMD)
        this._success(msg)
        return this.sessionBuilder(hostId)
    }

    async _envModeOperation(){
        let env = await this.cortex.AsyncEmitToOneOf({type:this.type, call:'env.get'});
        const {ENV_MODE} = await this.questions.envModeQuestion()
        if(ENV_MODE === 0){
            const {ADD_OR_UPDATE} = await this.questions.addOrUpdateEnvQuestion()
            if(ADD_OR_UPDATE === 'add'){
                const {ENV_NEW_KEY} = await this.questions.envNewKeyQuestion()
                await this._addNewKey(ENV_NEW_KEY)
                await this._restartSingleKeyOperation(env)
            }
            else if(ADD_OR_UPDATE === 'update'){
                await this._singleKeyOperation(env)
                await this._restartSingleKeyOperation(env)
            }

        }else if(ENV_MODE === 1){
            await this._wholeFileOperation(env)
        }
    }

    async _addNewKey(key){
        const {ENV_VALUE} = await this.questions.envNewKeyValueQuestion(key)
        // let res = await this.cortex.AsyncEmitToOneOf({type:this.type, call:'env.add', args:{key, value:ENV_VALUE}})
        let res = await this._emitToAllOfCb(this.type, 'env.add', {key, value:ENV_VALUE})
        // console.log(res)
        this._info(`Successful Operations: ${res.affected[1]}, Failed Operations: ${res.affected[0]}`)
        console.log('\n')
        res.nodes.forEach(node => {
            if(node.msg){
                this._success(`${node.hostname}: ${node.result}`)
            } else if(node.error){
                this._failure(`${node.hostname}: ${node.result}`)
            }
        });
        console.log('\n')
        this._warning('Kindly restart the service to load the new .env!!')
        // if(res.msg){

        //     this._success(res.msg)
        //     this._warning('Kindly restart the service to load the new .env!!')
        // } 
        // if(res.error) this._failure(res.error)
    }

    async _singleKeyOperation(env){
        const {ENV_KEY} = await this.questions.envKeyQuestion(env[this.type].env)
        const {ENV_OP} = await this.questions.envKeyOperationQuestion()
        if(ENV_OP=== 'delete') await this._deleteKey(ENV_KEY)
        else await this[`_${ENV_OP}Key`](ENV_KEY, env[this.type].env)
    }

    async _getKey(key, env){
        let res = env[key]
        if(res) this._success(`The value of the requested key ${key} is: ${res}`)
        else this._failure(`Key: ${key} doesn't exist!`)
    }

    async _setKey(key, env){
        const {ENV_VALUE} = await this.questions.envValueQuestion(key, env)
        // let res = await this.cortex.AsyncEmitToOneOf({type:this.type, call:'env.set', args:{key, value:ENV_VALUE}})
        
        let res = await this._emitToAllOfCb(this.type, 'env.set', {key, value:ENV_VALUE})
        // console.log(res)
        this._info(`Successful Operations: ${res.affected[1]}, Failed Operations: ${res.affected[0]}`)
        console.log('\n')
        for (let n = 0; n < res.nodes.length; n++) {
            const node = res.nodes[n];
            if(node.msg){
                this._success(`${node.hostname}: ${node.result}`)
                this._success(`Output: \n${node.msg}`)
            } else if(node.error){
                this._failure(`${node.hostname}: ${node.result}`)
                this._success(`Error: \n${node.msg}`)
            }   
        }
        
        // if(res.msg){
        //     this._success(res.msg)
        //     this._warning('Kindly restart the service to load the new .env!!')
        // } 
        // if(res.error) this._failure(res.error)
    }

    async _deleteKey(key){
        // let res = await this.cortex.AsyncEmitToOneOf({type:this.type, call:'env.delete', args:{key}})
        let res = await this._emitToAllOfCb(this.type, 'env.delete', {key})
        // console.log(res)
        this._info(`Successful Operations: ${res.affected[1]}, Failed Operations: ${res.affected[0]}`)
        console.log('\n')
        for (let n = 0; n < res.nodes.length; n++) {
            const node = res.nodes[n];
            if(node.msg){
                this._success(`${node.hostname}: ${node.result}`)
                this._success(`Output: \n${node.msg}`)
            } else if(node.error){
                this._failure(`${node.hostname}: ${node.result}`)
                this._success(`Error: \n${node.msg}`)
            }   
        }
        
        // if(res.msg){
        //     this._success(res.msg)
        //     this._warning('Kindly restart the service to load the new .env!!')
        // } 
        // if(res.error) this._failure(res.error)
    }

    async _restartSingleKeyOperation(){
        const {IS_RESTART_ENV} = await this.questions.restartSingleKeyQuestion()
        if(IS_RESTART_ENV) await this._envModeOperation()
    }
    

    async _wholeFileOperation(env){
        const {EDITOR_RESULT} = await this.questions.editorQuestion(env[this.type].env)
        let res = await this.cortex.AsyncEmitToOneOf({type:this.type, call:'env.write', args:{data:EDITOR_RESULT}})
        if(res.msg){
            this._success(res.msg)
            this._warning('Kindly restart the service to load the new .env!!')
        } 
        if(res.error) this._failure(res.error)

    }

    async _remoteExecutionOperation(){
        let {CMD} = await this.questions.cmdQuestion()
        // let res = await this.cortex.AsyncEmitToOneOf({type:this.type, call:'env.execute', args:{cmd:CMD}})
        let res = await this._emitToAllOfCb(this.type, 'env.execute', {cmd:CMD})
        // console.log(res)
        this._info(`Successful Operations: ${res.affected[1]}, Failed Operations: ${res.affected[0]}`)
        console.log('\n')
        for (let n = 0; n < res.nodes.length; n++) {
            const node = res.nodes[n];
            if(node.msg){
                this._success(`${node.hostname}: ${node.result}`)
                this._success(`Output: \n${node.msg}`)
            } else if(node.error){
                this._failure(`${node.hostname}: ${node.result}`)
                this._success(`Error: \n${node.msg}`)
            }   
        }
        // res.nodes.forEach(node => {
        //     if(node.msg){
        //         this._success(`${node.hostname}: ${node.result}`)
        //     } else if(node.error){
        //         this._failure(`${node.hostname}: ${node.result}`)
        //     }
        // });
        console.log('\n')
        this._warning('Kindly restart the service to load the new .env!!')
        // if(res.msg) this._success(res.msg)
        // if(res.error) this._failure(res.error)
    }

    async _restartOperation(){
        const {IS_RESTART} = await this.questions.restartOperationQuestion()
        if(IS_RESTART){
            await this._operationStart()
        }else{
            process.exit()
        }
    }

}

const floki = new Floki({questions})