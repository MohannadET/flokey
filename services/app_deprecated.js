const vorpal    = require('vorpal')();
const Cortex    = require('ion-cortex')
const spawnedShell = require('child_process').spawn('/bin/sh');

class Flokey {

    constructor({}){
        
        /** init cortex */
        this.cortex     = null
        this.type       = ""
        this.hosts      = null
        this.hostsW_hostnames = null
        this.spawnedShells = {}
        this._init()
    }

    async _init(){
        await this._initCortex()
        setTimeout(() => {
            this._assignHosts()
            setInterval(() => {
                this._assignHosts()
            }, 3000);
        }, 2000);
        this._initCLI()
    }

    _assignHosts(){
        let {hosts, hostsW_hostnames} = this.returnTypeToHostCortex(this.cortex)
        this.hosts              = hosts
        this.hostsW_hostnames   = hostsW_hostnames
    }

    async _initCortex(){
        this.cortex = new Cortex({
            prefix: 'spacejat',
            url: 'redis://127.0.0.1:6379',
            type: 'flokey',
            state: ()=>{
                return {} 
            },
            activeDelay: 1000,
            idleDelay: 1000,
        });
    }
    _initCLI() {
        let flokey = this
        vorpal
            .command('hosts', 'Get all cortex hosts.')
            .action(function(args, callback) {
                if(!flokey.hostsW_hostnames){
                    flokey._assignHosts()
                }
                this.log(flokey.hostsW_hostnames)
                callback();
            })
        vorpal    
            .command('spawn [host]', 'Spawn a shell on the chosen host.')
            .action(async function(args, callback) {
                if(!flokey.hosts) flokey._assignHosts()
                if(flokey.hosts.includes(args.host)){
                    let spawnedShell = await flokey.cortex.AsyncEmit({to:args.host, call:'spawn', args:{}})
                    if(!spawnedShell.error){
                        console.log(spawnedShell)
                        flokey.spawnedShells[args.host] = spawnedShell
                        flokey._initHostREPL(args)
                    } else {
                        this.log(spawnedShell.error)
                    }
                } else {
                    this.log('Chosen host is not available')
                }
                callback();
            })

        vorpal
            .delimiter('flokey$')
            .show()
            .parse(process.argv);
    }

    _initHostREPL(args){
        vorpal
            .mode(`repl`, 'Enters REPL mode for a specific host.')
            .delimiter(`repl:${args.host}$`)
            .init(function (args, cb) {
                console.log('Entering REPL Mode. To exit, type \'exit\'.');
                cb();
            })
            .action(async function(cmd, cb) {
                try {
                    let execCMD = await flokey.cortex.AsyncEmit({to:args.host, call:'execute', args:{cmd}})
                    console.log(execCMD.msg)
                    cb(execCMD.msg);
                } catch (e) {
                    console.log(e);
                    cb(e);
                }
            });
        vorpal.exec(`repl`);
    }

    returnTypeToHostCortex = (cortex) => {
        let hostsW_hostnames = []
        let hosts = []
        let array = Object.entries(cortex.nodes)
        if(array.length > 0){
            for (let n = 0; n < array.length; n++) {
                const node = array[n][0];
                if(node.includes('_minion')){
                    const host = Object.keys(array[n][1])[0];
                    const hostname = cortex.nodes[node][host].state.os.hostname
                    hostsW_hostnames.push(`${host}@(${hostname})`)
                    hosts.push(`${host}`)
                }
            }
        }
        return {hosts, hostsW_hostnames}
    }

}

const flokey = new Flokey({})