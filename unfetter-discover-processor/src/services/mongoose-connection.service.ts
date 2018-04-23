// The maximum amount of tries mongo will attempt to connect
const MAX_NUM_CONNECT_ATTEMPTS = process.env.MAX_NUM_CONNECT_ATTEMPTS || 10;
// The amount of time between each connection attempt in ms
const CONNECTION_RETRY_TIME = process.env.CONNECTION_RETRY_TIME || 5000;

import * as mongoose from 'mongoose';

import argv from './cli.service';

/**
 * @returns Promise
 * @description Attempts to connect to mongo DB, resolves when successful
 */
export default function mongoInit(): Promise<mongoose.Connection> {
    return new Promise((resolve, reject) => {
        let conIntervel: any;
        let connAttempts = 0;

        // Wait for mongoose to connect before processing
        mongoose.connection.on('connected', () => {
            console.log('connected to mongodb');
            clearInterval(conIntervel);
            resolve(mongoose.connection);
        });
        mongoose.connection.on('error', (err) => {
            console.log(`Mongoose connection error: ${err}`);
            if (connAttempts >= MAX_NUM_CONNECT_ATTEMPTS) {
                clearInterval(conIntervel);
                console.log('Maximum number of connection attempts exceeded. Terminating program.');
                reject(err);
                process.exit(1);
            }
        });
        conIntervel = setInterval(() => {
            connAttempts += 1;
            mongoose.connect(`mongodb://${argv.host}:${argv.port}/${argv.database}`);
        }, CONNECTION_RETRY_TIME);
    });
}
