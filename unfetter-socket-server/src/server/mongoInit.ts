process.env.MONGO_REPOSITORY = process.env.MONGO_REPOSITORY || 'localhost';
process.env.MONGO_PORT = process.env.MONGO_PORT || '27018';
process.env.MONGO_DBNAME = process.env.MONGO_DBNAME || 'stix';

import * as mongoose from 'mongoose';

import configModel from '../models/mongoose/config';
import stixModel from '../models/mongoose/stix';

const getConfig = () => new Promise((resolve, reject) => {
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

export function mongoInit() {
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
                getConfig()
                    .then((msg: string) => resolve(msg))
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
