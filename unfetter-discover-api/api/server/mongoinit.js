process.env.MONGO_REPOSITORY = process.env.MONGO_REPOSITORY || 'localhost';
process.env.MONGO_PORT = process.env.MONGO_PORT || 27018;
process.env.MONGO_DBNAME = process.env.MONGO_DBNAME || 'stix';

global.JWT_DURATION_SECONDS = 900;

const modelFactory = require('../controllers/shared/modelFactory');
const mongoose = require('mongoose');

const identityModel = modelFactory.getModel('identity');

const mongoDebug = process.env.MONGO_DEBUG || false;
mongoose.set('debug', mongoDebug);
mongoose.Promise = global.Promise;

/**
 * @description populate global lookup values
 */
const lookupGlobalValues = () => new Promise((resolve, reject) =>{
    console.log('looking up global values...');
    // TODO get config info
    if (global.unfetter.identities === undefined) {
        identityModel
            .findOne({ 'stix.type': 'identity', 'stix.name': 'Unfetter Open' })
            .exec((err, result) => {
                if (err) {
                    reject('Unable to get identities');
                    return;
                }

                const openIdent = { ...result };
                global.unfetter.identities = [
                    ...(global.unfetter.identities || []),
                    openIdent,
                ];
                global.unfetter.openIdentity = openIdent;
                console.log('set open identity with id, ', openIdent._id || '');
                resolve('Identities recieved');
            });
    }
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
                .then((_) => resolve('Mongo DB running'))
                .catch((errMsg) => reject(errMsg));
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
