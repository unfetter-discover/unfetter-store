process.env.MONGO_REPOSITORY = process.env.MONGO_REPOSITORY || 'localhost';
process.env.MONGO_PORT = process.env.MONGO_PORT || '27018';
process.env.MONGO_DBNAME = process.env.MONGO_DBNAME || 'stix';
process.env.MONGO_USER = process.env.MONGO_USER || '';
process.env.MONGO_PASSWORD = process.env.MONGO_PASSWORD || '';

// The maximum amount of tries mongo will attempt to get processor Status
const MAX_GET_PROCESSOR_STATUS_ATTEMPTS = process.env.MAX_GET_PROCESSOR_STATUS_ATTEMPTS || 10;
// The amount of time between each connection attempt in ms
const GET_PROCESSOR_RETRY_TIME = process.env.GET_PROCESSOR_RETRY_TIME || 5000;
const PROCESSOR_STATUS_ID = process.env.PROCESSOR_STATUS_ID || 'f09ad23d-c9f7-40a3-8afa-d9560e6df95b';

import * as mongoose from 'mongoose';

export function mongoInit() {
    if (global.conn === undefined) {
        const authString = process.env.MONGO_USER && process.env.MONGO_PASSWORD ? `${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@` : '';
        mongoose.connect(`mongodb://${encodeURI(authString)}${process.env.MONGO_REPOSITORY}:${process.env.MONGO_PORT}/${process.env.MONGO_DBNAME}`, {
            server: {
                poolSize: 5,
                reconnectTries: 100,
                socketOptions: {
                    keepAlive: 300000,
                    connectTimeoutMS: 30000
                }
            });
        }
    }, GET_PROCESSOR_RETRY_TIME);
});

const getConfig = (): Promise<string> => new Promise((resolve, reject) => {
    const promises = [];

    promises.push(stixModel.findOne({ 'stix.type': 'identity', 'stix.name': 'Unfetter Open' }).exec());

    promises.push(configModel.find({}).exec());

    Promise.all(promises)
        .then(([identity, configurations]: [any, any[]]) => {
            if (identity) {
                const openIdent = identity.toObject().stix;
                global.unfetteropenid = openIdent.id;
            } else {
                global.unfetteropenid = null;
            }
            if (configurations && configurations.length) {
                global.unfetterconfigurations = configurations.map((config) => config.toObject());
            }
            resolve('Configuriations and Identities retrieved');
        })
        .catch((err) => reject(`Unable to get identities and/or configurations: ${err}`));
});

export default function mongoInit(): Promise<string> {
    return new Promise((resolve, reject) => {
        if (global.conn === undefined) {
            mongoose.connect(`mongodb://${process.env.MONGO_REPOSITORY}:${process.env.MONGO_PORT}/${process.env.MONGO_DBNAME}`, {
                server: {
                    poolSize: 5,
                    reconnectTries: 100,
                    socketOptions: {
                        keepAlive: 300000,
                        connectTimeoutMS: 30000
                    }
                }
            });

            const db = global.conn = mongoose.connection;

            db.on('error', () => reject('Error while attempting to connect to database'));

            db.on('connected', () => {
                getProcessorStatus()
                    .then((_) => {
                        getConfig()
                            .then((msg: string) => resolve(msg))
                            .catch((err) => reject(err));
                    })
                    .catch((err) => reject(err));                
            });

            db.on('disconnected', () => console.log('disconnected from mongodb'));

            process.on('SIGINT', () => {
                db.close(() => {
                    console.log('Safely closed MongoDB Connection');
                    process.exit(0);
                });
            });
        }
    })
};
