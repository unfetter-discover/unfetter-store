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

const mongoDebug = process.env.MONGO_DEBUG || true;
mongoose.set('debug', mongoDebug);
mongoose.Promise = global.Promise;

const getProcessorStatus = () => new Promise((resolve, reject) => {
    let retryAttempts = 0;
    const getProcessInterval = setInterval(() => {
        retryAttempts += 1;
        console.log('Attempting to get processor status, try# ', retryAttempts);
        if (retryAttempts >= MAX_GET_PROCESSOR_STATUS_ATTEMPTS) {
            clearInterval(getProcessInterval);
            reject(new Error('Maximum number of attempts to get processor status exceeded'));
        } else {
            utilityModel.findById(PROCESSOR_STATUS_ID, (err, res) => {
                if (!err && res) {
                    const processorStatus = res.toObject();
                    if (processorStatus.utilityValue === 'COMPLETE') {
                        clearInterval(getProcessInterval);
                        resolve(true);
                    }
                }
            });
        }
    }, GET_PROCESSOR_RETRY_TIME);
});

/**
 * @description populate global lookup values
 */
const lookupGlobalValues = () => new Promise((resolve, reject) => {
    console.log('looking up global values...');

    const promises = [];

    promises.push(identityModel
        .findOne({ 'stix.type': 'identity', 'stix.name': 'Unfetter Open' }).exec());

    promises.push(configModel.find({}).exec());

    Promise.all(promises)
        .then(([identity, configurations]) => {
            let openIdent;
            if (identity) {
                console.log('Open identity set to saved document');
                openIdent = { ...identity.toObject() };
            } else {
                console.log('Open identity set to default');
                openIdent = {
                    _id: 'identity--e240b257-5c42-402e-a0e8-7b81ecc1c09a',
                    stix: {
                        name: 'Unfetter Open',
                        identity_class: 'organization',
                        id: 'identity--e240b257-5c42-402e-a0e8-7b81ecc1c09a',
                        description: 'This is an organization open to all Unfetter users.',
                        type: 'identity',
                        modified: '2017-11-01T18:42:35.073Z',
                        created: '2017-11-01T18:36:59.472Z',
                        labels: [
                            'open-group'
                        ]
                    }
                };
            }
            global.unfetter.identities = [
                ...(global.unfetter.identities || []),
                openIdent,
            ];
            global.unfetter.openIdentity = openIdent;
            console.log('set open identity with id,', openIdent._id || '');

            const configObjs = configurations.map(configuration => configuration.toObject());
            const jwtDurationSeconds = configObjs.find(configObj => configObj.configKey === 'jwtDurationSeconds');

            if (jwtDurationSeconds !== undefined) {
                console.log('jwtDurationSeconds set to saved configuration');
                global.unfetter.JWT_DURATION_SECONDS = jwtDurationSeconds.configValue;
            } else {
                console.log('Unable to find jwtDurationSeconds configuration');
                global.unfetter.JWT_DURATION_SECONDS = 900;
            }

            resolve('Identities recieved');
        })
        .catch(err => reject(new Error('Unable to get identities and/or configurations: '), err));
});

module.exports = () => new Promise((resolve, reject) => {
    global.unfetter = global.unfetter || {};
    if (global.unfetter.conn === undefined) {
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
