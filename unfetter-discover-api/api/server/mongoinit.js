process.env.MONGO_REPOSITORY = process.env.MONGO_REPOSITORY || 'localhost';
process.env.MONGO_PORT = process.env.MONGO_PORT || 27018;
process.env.MONGO_DBNAME = process.env.MONGO_DBNAME || 'stix';

const modelFactory = require('../controllers/shared/modelFactory');
const identityModel = modelFactory.getModel('identity');

const mongoose = require('mongoose');


const mongoDebug = process.env.MONGO_DEBUG || true;
mongoose.set('debug', mongoDebug);
mongoose.Promise = global.Promise;

/**
 * @description populate global lookup values
 */
lookupGlobalValues = (db) => {
    console.log('looking up global values...');
    if (global.unfetter.identities === undefined) {
        identityModel
            .findOne({ 'stix.type': 'identity', 'stix.name': 'Unfetter Open' })
            .exec((err, result) => {
                if (err) {
                    return;
                }

                const openIdent = { ...result };
                global.unfetter.identities = [
                    ...(global.unfetter.identities || []),
                    openIdent,
                ];
                global.unfetter.openIdentity = openIdent;
                console.log('set open identity with id, ', openIdent._id || '');
            });
    }
};

module.exports = new Promise((resolve, reject) => {
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

        const db = global.unfetter.conn = mongoose.connection;
        db.on('error', () => {
            console.error(console, 'connection error:');
            reject('error connecting to monogo');
        });
        db.on('connected', () => {
            console.log('connected to mongodb');
            lookupGlobalValues();
            resolve(global.unfetter.conn);
        });
        db.on('disconnected', () => console.log('disconnected from mongodb'));
        process.on('SIGINT', () => {
            db.close(() => {
                console.log('Safely closed MongoDB Connection');
                process.exit(0);
            });
        });
    }
    resolve(global.unfetter.conn);
});
