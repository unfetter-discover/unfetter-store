process.env.MONGO_REPOSITORY = process.env.MONGO_REPOSITORY || 'localhost';
process.env.MONGO_PORT = process.env.MONGO_PORT || '27018';
process.env.MONGO_DBNAME = process.env.MONGO_DBNAME || 'stix';

import * as mongoose from 'mongoose';

export function mongoInit() {
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
        db.on('error', console.error.bind(console, 'connection error:'));
        db.on('connected', () => console.log('connected to mongodb'));
        db.on('disconnected', () => console.log('disconnected from mongodb'));
        process.on('SIGINT', () => {
            db.close(() => {
                console.log('Safely closed MongoDB Connection');
                process.exit(0);
            });
        });
    }
};
