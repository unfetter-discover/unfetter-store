process.env.MONGO_REPOSITORY = process.env.MONGO_REPOSITORY || 'localhost';
process.env.MONGO_PORT = process.env.MONGO_PORT || 27018;
process.env.MONGO_DBNAME = process.env.MONGO_DBNAME || 'stix';

const modelFactory = require('../controllers/shared/modelFactory');
const mongoose = require('mongoose');

const identityModel = modelFactory.getModel('identity');
const configModel = modelFactory.getModel('config');

const mongoDebug = process.env.MONGO_DEBUG || false;
mongoose.set('debug', mongoDebug);
mongoose.Promise = global.Promise;

/**
 * @description populate global lookup values
 */
const lookupGlobalValues = () => new Promise((resolve, reject) => {
    console.log('looking up global values...');

    const promises = [];

    promises.push(identityPromise = identityModel
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
        .catch(err => reject('Unable to get identities and/or configurations: ', err));
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
            reject('error connecting to monogo');
        });
        db.on('connected', () => {
            console.log('connected to mongodb');
            lookupGlobalValues()
                .then(_ => resolve('Mongo DB running'))
                .catch(errMsg => reject(errMsg));
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
