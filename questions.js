const inquirer              = require('inquirer');
inquirer.registerPrompt('search-list', require('inquirer-search-list'));

module.exports = () => {
    return {
        redisURIQuestion : () => {
            const question = [
                {
                    name: 'redisURI',
                    type: "input",
                    message: 'Enter your Redis URI:',
                    default: 'redis://127.0.0.1:6379'
                }
            ]
            return inquirer.prompt(question)
        
        },

        cortexPrefixQuestion : () => {
            const question = [
                {
                    name: 'cortexPrefix',
                    type: "input",
                    message: 'Enter your Cortex Prefix:',
                    default: 'none'
                }
            ]
            return inquirer.prompt(question)
        
        },
        chooseEnvQuestion: () => {
            const question = [
                {
                    name: 'env',
                    type: "list",
                    message: 'Choose the environment:',
                    choices: ['dev', 'prd'],
                    default: 'dev',
                }
            ]
            return inquirer.prompt(question)
        
        },
        operationModeQuestion : () => {
            const question = [
                {
                    name: 'operationMode',
                    type: "list",
                    message: 'Select operation mode:',
                    choices: ['Hosts', 'Services'],
                    default: 'Services',
                    filter(val) {
                        return val.includes('Services') ? 0 : 1
                    }
                }
            ]
            return inquirer.prompt(question)
        
        },
        operationTypeQuestion : () => {
            const question = [
                {
                    name: 'operationType',
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

        hostsQuestion : async (builder) => {
            const question = [
                {
                    name: 'HOST',
                    type: "search-list",
                    message: 'Select Host:',
                    choices: builder.getHosts(),
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
        
        cmdQuestion : (hostId) => {
            const question = hostId? 
            [
                {
                    name: 'CMD',
                    type: "input",
                    message: `${hostId}:$`,
                }
            ] : 
            [
                {
                    name: 'CMD',
                    type: "input",
                    message:`Enter command to be executed:`,
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
                    message: 'Choose .env editing mode:',
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
                    message: `Enter new key property:`,
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
                    message: `Enter a value for your new key [${key}]:`,
                }
            ]
            return inquirer.prompt(question)
        
        },

        envKeyOperationQuestion : () => {
            const question = [
                {
                    name: 'ENV_OP',
                    type: "list",
                    message: 'Choose operation to perform on key?',
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
                    message: 'Choose key to replace its value?',
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
                    message: `Enter new value for ${key}:`,
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