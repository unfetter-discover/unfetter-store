process.env.MONGO_REPOSITORY = process.env.MONGO_REPOSITORY || 'localhost';
process.env.MONGO_PORT = process.env.MONGO_PORT || 27018;
process.env.MONGO_DBNAME = process.env.MONGO_DBNAME || 'stix';
process.env.MONGO_USER = process.env.MONGO_USER || '';
process.env.MONGO_PASSWORD = process.env.MONGO_PASSWORD || '';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

module.exports = () => {
    if (global.conn === undefined) {
        const authString = process.env.MONGO_USER && process.env.MONGO_PASSWORD ? `${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@` : '';
        mongoose.connect(`mongodb://${encodeURI(authString)}${process.env.MONGO_REPOSITORY}:${process.env.MONGO_PORT}/stix`, {
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
        process.on('SIGINT', function () {
            db.close(function () {
                console.log('Safely closed MongoDB Connection');
                process.exit(0);
            });
        });
    }     
};