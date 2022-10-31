
require('dotenv').config()
const os                                = require('os');
const pjson                             = require('../package.json');
const utils                             = require('../libs/utils');
const SERVICE_NAME                      = (process.env.SERVICE_NAME)? utils.slugify(process.env.SERVICE_NAME):pjson.name;
const USER_PORT                         = process.env.USER_PORT || 5111;
const ADMIN_PORT                        = process.env.ADMIN_PORT || 5222;
const ADMIN_URL                         = process.env.ADMIN_URL || `http://localhost:${ADMIN_PORT}`;
const ENV                               = process.env.ENV || "production";
const REDIS_URI                         = process.env.REDIS_URI;

const CORTEX_PREFIX                     = process.env.CORTEX_PREFIX || 'none';
const CORTEX_REDIS                      = process.env.CORTEX_REDIS || REDIS_URI;
const CORTEX_TYPE                       = process.env.CORTEX_TYPE || SERVICE_NAME;

const CACHE_REDIS                       = process.env.CACHE_REDIS || REDIS_URI;
const CACHE_PREFIX                      = process.env.CACHE_PREFIX || `${SERVICE_NAME}:ch`;
const MONGO_URI                         = process.env.MONGO_URI || `mongodb://localhost:27017/${SERVICE_NAME}`;

const PRIVATE_KEY_PATH                  = process.env.PRIVATE_KEY_PATH
const SSH_USER                          = process.env.SSH_USER || 'root'
// const INTEGRATE_DO                      = process.env.INTEGRATE_DO || false
// const ENVIRONMENT                       = process.env.ENVIRONMENT || 'dev'
// const BASTION                           = process.env.BASTION
// const DO_TOKEN                          = process.env.DO_TOKEN

const config                            = require(`./envs/${ENV}.js`);

// if(!PRIVATE_KEY_PATH) throw Error('A Private key path must be provided in env (PRIVATE_KEY_PATH)');

config.dotEnv = {
    SERVICE_NAME,
    ENV,
    CORTEX_REDIS,
    CORTEX_PREFIX,
    CORTEX_TYPE,
    CACHE_REDIS,
    CACHE_PREFIX,
    MONGO_URI,
    USER_PORT,
    ADMIN_PORT,
    ADMIN_URL,
    PRIVATE_KEY_PATH,
    SSH_USER,
    // ENVIRONMENT,
    // BASTION,
    // DO_TOKEN,
    // INTEGRATE_DO
};



module.exports = config;
