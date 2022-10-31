const {NodeSSH}             = require('node-ssh')
const ssh                   = new NodeSSH()

class BuilderSSH {
    constructor({cortex, config}){
        this.cortex             = cortex
        this.config             = config    
        this.privKey            = null
        this.user               = null
        this.cwd                = '/root'
        this.hosts              = {}
        this.hostsW_Hostname    = []
        setTimeout(() => {
            this._getHosts()
        }, 2000);
        setInterval(() => {
            this._getHosts()
        }, 15000);
    }

    _getHosts(){
        let list  = []
        if(this.cortex && this.cortex.nodes && Object.keys(this.cortex.nodes).length > 0){
            Object.keys(this.cortex.nodes).forEach(type => {
                // console.log(type)
                Object.keys(this.cortex.nodes[type]).forEach(hostId => {
                    // console.log(hostId)
                    // console.log(this.cortex.nodes[type][hostId].state.os.network)
                    if(this.cortex.nodes &&
                        this.cortex.nodes[type][hostId].state && 
                        this.cortex.nodes[type][hostId].state.os.network && 
                        this.cortex.nodes[type][hostId].state.os.network.eth1){
                        let ip = this.cortex.nodes[type][hostId].state.os.network.eth1[0] 
                        this.hosts[hostId] = {
                            hostname:this.cortex.nodes[type][hostId].state.os.hostname,
                            ip,
                            type,
                        }
                        list.push(`${hostId} @ ${this.cortex.nodes[type][hostId].state.os.hostname}`)
                    }
                    
                })
            })
        }
        this.hostsW_Hostname = list
    }

    getHosts(){
        return this.hostsW_Hostname
    }

    assignPrivateKey(key){
        this.privKey = key
    }

    assignUser(user){
        this.user = user 
        this.cwd  = `/${user}`
    }

    async connect(hostId){
        let host = this.hosts[hostId]
        let ip = host.ip
        await ssh.connect({
            host: `${ip}`, // `${ip}`
            username: this.config.sshUser || 'root',
            privateKeyPath: this.config.privateKeyPath,
        })
    }

   async  checkCommand(hostId, cmd){
        try {
            let msg = null
            if(cmd.includes('cd ')){
                this.cwd = this._cdBuilder(cmd)  
                return `Changed directory to ${this.cwd}`
            } else {
                msg = await this.exec(cmd)
                return msg;
            }
            
        } catch (e) {
            console.log(e);
            return(e);
        }
    }

    async exec(cmd){
        let msg = null
        msg = await ssh.execCommand(cmd, {cwd:this.cwd})
        return msg.stdout ? msg.stdout : msg.stderr
    }

    _cdBuilder(cmd){
        let dir = cmd.split(' ')[1]
        let count = 0
        let cwd = this.cwd
        let newDir = null
        if(cmd.includes(' ../') || dir === '..'){
            if(dir === '..'){
                let cwdArr =  cwd.split('/')
                cwdArr.pop()
                if(cwdArr.length>1)newDir = cwdArr.join('/')
                cwd = newDir ? '/'+newDir:'/'
            } else {
                let arr = dir.split('/')
                arr.forEach(e => e === '..' ? count++ : null)
                console.log('../', count)
                let cwdArr = cwd.split('/')
                for(let i=1;i<=count;i++){
                    cwdArr.pop()
                }
                if(cwdArr.length>1)newDir = cwdArr.join('/')
                cwd = newDir ? '/'+newDir:'/'
            }
        } else if(cmd.includes(' ./')){
            let arr = dir.split('/')
            arr.forEach(e => e === '.' ? count++ : null)
            if(count > 0) cwd+='/'+dir.split('./')[0]
        } else if(dir[0] === '/'){
            cwd = dir
        } else { 
            if(dir === '/') cwd = '/' 
            else {
                if(cwd.charAt(cwd.length - 1) === '/') cwd += dir
                else cwd+='/'+dir
            }
        }
        return cwd
    }

}

module.exports = BuilderSSH