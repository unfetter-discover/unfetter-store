process.env.MONGO_REPOSITORY = process.env.MONGO_REPOSITORY || 'localhost';
process.env.MONGO_PORT = process.env.MONGO_PORT || 27018;
process.env.MONGO_DBNAME = process.env.MONGO_DBNAME || 'stix';

const modelFactory = require('../controllers/shared/modelFactory');
const mongoose = require('mongoose');

const utilityModel = require('../models/utility');

const identityModel = modelFactory.getModel('identity');
const configModel = modelFactory.getModel('config');

const PROCESSOR_STATUS_ID = process.env.PROCESSOR_STATUS_ID || 'f09ad23d-c9f7-40a3-8afa-d9560e6df95b';
// The maximum amount of tries mongo will attempt to get processor Status
const MAX_GET_PROCESSOR_STATUS_ATTEMPTS = process.env.MAX_GET_PROCESSOR_STATUS_ATTEMPTS || 10;
// The amount of time between each connection attempt in ms
const GET_PROCESSOR_RETRY_TIME = process.env.GET_PROCESSOR_RETRY_TIME || 5000;

const mongoDebug = process.env.MONGO_DEBUG || false;
mongoose.set('debug', mongoDebug);
mongoose.Promise = global.Promise;

module.exports = () => {
    if (global.conn === undefined) {
        mongoose.connect(`mongodb://${process.env.MONGO_REPOSITORY}:${process.env.MONGO_PORT}/stix`, {
            server: {
                poolSize: 12,
                reconnectTries: 100,
                socketOptions: {
                    keepAlive: 300000,
                    connectTimeoutMS: 30000
                }
            }
        });

        global.unfetter.conn = mongoose.connection;
        const db = global.unfetter.conn;
        db.on('error', () => {
            console.error(console, 'connection error:');
            reject(new Error('error connecting to mongo'));
        });
        db.on('connected', () => {
            console.log('connected to mongodb');
            getProcessorStatus()
                .then(_ => { // eslint-disable-line no-unused-vars
                    lookupGlobalValues()
                        .then(__ => resolve('Mongo DB running')) // eslint-disable-line no-unused-vars
                        .catch(errMsg => reject(errMsg));
                })
                .catch(err => reject(err));
        });
        db.on('disconnected', () => console.log('disconnected from mongodb'));
        process.on('SIGINT', () => {
            db.close(() => {
                console.log('Safely closed MongoDB Connection');
                process.exit(0);
            });
        });
    }
});
