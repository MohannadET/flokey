const inquirer              = require('inquirer');

module.exports = (cortex) => {
    return {
        redisURIQuestion : () => {
            const question = [
                {
                    name: 'redisURI',
                    type: "input",
                    message: 'Please enter your Redis URI?',
                    default: 'redis://dev:Q9eqHXDMN97W@139.59.142.183:6200'
                }
            ]
            return inquirer.prompt(question)
        
        },

        cortexPrefixQuestion : () => {
            const question = [
                {
                    name: 'cortexPrefix',
                    type: "input",
                    message: 'Please enter your Cortex Prefix?',
                    default: 'none'
                }
            ]
            return inquirer.prompt(question)
        
        },

        operateQuestion : () => {
            const question = [
                {
                    name: 'MODE',
                    type: "list",
                    message: 'Please choose operation mode?',
                    choices: ['Configure .env', 'Remote Command Execution'],
                    filter(val) {
                        return val.includes('.env') ? 0 : 1
                    }
                }
            ]
            return inquirer.prompt(question)
        
        },
        
        nodesQuestion : async (cortex) => {
            const question = [
                {
                    name: 'NODE',
                    type: "rawlist",
                    message: 'Please choose Node to configure?',
                    choices: Object.keys(cortex.nodes).filter(n => n.includes('_minion')).map(n => n.split('_')[0]),
                }
            ]
            return inquirer.prompt(question)
        },
        
        cmdQuestion : () => {
            const question = [
                {
                    name: 'CMD',
                    type: "input",
                    message: 'Please enter command to be executed..',
                    default: 'cd .. && ll'
                }
            ]
            return inquirer.prompt(question)
        
        },
        
        editorQuestion : async (env) => {
            let envFormat = ""
            for (const [key, value] of Object.entries(env)) {
                envFormat+= `${key}=${value}\n`
            }
            const question = [
                {
                    name: 'EDITOR_RESULT',
                    type: "editor",
                    message: 'edit .env',
                    default: envFormat,
                }
            ]
            return inquirer.prompt(question)
        },
        
        envModeQuestion : () => {
            const question = [
                {
                    name: 'ENV_MODE',
                    type: "list",
                    message: 'Please choose .env editing mode?',
                    choices: ['Single Key-Value.', 'Whole file edit.'],
                    filter(val) {
                        return val.includes('Key-Value') ? 0 : 1
                    }
                }
            ]
            return inquirer.prompt(question)
        },
        addOrUpdateEnvQuestion : () => {
            const question = [
                {
                    name: 'ADD_OR_UPDATE',
                    type: "list",
                    message: 'Add new key or update existing?',
                    choices: ['add','update'],
                }
            ]
            return inquirer.prompt(question)
        },
        
        envNewKeyQuestion : () => {
            const question = [
                {
                    name: 'ENV_NEW_KEY',
                    type: "input",
                    message: `Please enter new key property:`,
                    default:`TEST`
                }
            ]
            return inquirer.prompt(question)
        
        },

        envNewKeyValueQuestion : (key) => {
            const question = [
                {
                    name: 'ENV_VALUE',
                    type: "input",
                    message: `Please enter a value for your new key [${key}]:`,
                }
            ]
            return inquirer.prompt(question)
        
        },

        envKeyOperationQuestion : () => {
            const question = [
                {
                    name: 'ENV_OP',
                    type: "list",
                    message: 'Please choose operation to perform on key?',
                    choices: ['get','set','delete'],
                }
            ]
            return inquirer.prompt(question)
        },

        envKeyQuestion : (env) => {
            let envKeys = Object.keys(env)
            const question = [
                {
                    name: 'ENV_KEY',
                    type: "list",
                    message: 'Please choose key to replace its value?',
                    choices: envKeys,
                }
            ]
            return inquirer.prompt(question)
        },

        envValueQuestion : (key, env) => {
            const question = [
                {
                    name: 'ENV_VALUE',
                    type: "input",
                    message: `Please enter new value for ${key}:`,
                    default:`${env[key]}`
                }
            ]
            return inquirer.prompt(question)
        
        },

        restartSingleKeyQuestion : () => {
            const question = [
                {
                    name: 'IS_RESTART_ENV',
                    type: "confirm",
                    message: 'Would you like to continue editing .env?',
                    default: true
                }
            ]
            return inquirer.prompt(question)
        
        },

        restartOperationQuestion : () => {
            const question = [
                {
                    name: 'IS_RESTART',
                    type: "confirm",
                    message: 'Would you like to do further operations?',
                    default: true
                }
            ]
            return inquirer.prompt(question)
        
        },
    }
}