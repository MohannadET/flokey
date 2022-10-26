const config                = require('../config/index.config.js');
const BuilderSSH            = require('./BuilderSSH')
const util                  = require('node:util');
const exec                  = util.promisify(require('node:child_process').exec);
const fs                    = require('fs');

class BuilderSSHDO extends BuilderSSH {
    constructor({cortex, user, privKey}){
        super(cortex, user, privKey)
        this.host           = config.dotEnv.BASTION
        this.environment    = config.dotEnv.ENVIRONMENT
        this.do_token       = config.dotEnv.DO_TOKEN
        this.inventoryCMD   = `./do-ansible-inventory --access-token ${this.do_token} --tag ${this.environment} > ${process.cwd()}/do_hosts`
        this.hosts          = {}
        this._getHosts(this.inventoryCMD)
        setInterval(() => {
            this._getHosts(this.inventoryCMD)
        }, 10000);
    }

    async _getHosts(cmd){
        let hosts = []
        const { stdout, stderr } = await exec(cmd, {cwd:'./services/'});
        // console.log(stderr)
        const data = fs.readFileSync(`do_hosts`, 'utf8');
        data.split('\n').forEach(h => {
            if(h.includes('ansible')){
                let res = h.split('\tansible_host=')
                let host = res[0]
                let ip = res[1]
                this.hosts[host] = ip
            }
        })
        console.log(this.hosts)
        
    }

    


}

module.exports = BuilderSSHDO