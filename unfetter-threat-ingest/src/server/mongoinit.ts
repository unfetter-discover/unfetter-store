import mongoose = require('mongoose');
mongoose.Promise = global.Promise;

import * as modelFactory from '../models/modelFactory';
const configModel = modelFactory.getModel('config');

/**
 * @description populate global configuration
 */
const lookupConfiguration = (argv: any) => new Promise((resolve, reject) => {
    const defaults = {
        'refresh.interval': argv['refresh-interval'] * 60 * 1000,
    };
    const configuration: any = Object.assign({}, defaults);
    const promises = [];
    console.log('Looking up configuration...');
    promises.push(configModel.find({ configGroups: 'feed' }, { configKey: 1, configValue: 1, _id: 0 }).exec());
    Promise.all(promises)
        .then(([configurations]) => {
            const feedsConfiguration = configurations
                .forEach((configItem: any) => {
                    const configObject = configItem.toObject();
                    configuration[configObject.configKey] = configObject.configValue;
                });
            argv.state.configuration = configuration;
            if (argv.debug) {
                console.debug('Read configuration from Mongo:', argv.state.configuration);
            }
            resolve('Configuration received');
        })
        .catch((err) => reject(new Error(`Unable to get configurations: ${err}`)));
});

const refreshConfiguration = (argv: any) => {
    if (argv.debug) {
        console.log('Reloading configuration.');
    }
    lookupConfiguration(argv)
        .then(() => {
            if (argv.debug) {
                console.log('Configuration refreshed.');
            }
        })
        .catch((errMsg) => {
            console.error('Configuration was not refreshed:', errMsg);
        });
    argv.state.refreshTimer = setTimeout(() => {
        refreshConfiguration(argv);
    }, argv['refresh-interval'] * 60 * 1000);
}

const shutdownDatabase = (db: mongoose.Connection, argv: any, code: number = 0) => {
    if (argv.state.refreshTimer) {
        clearTimeout(argv.state.refreshTimer);
    }
    db.close(() => {
        console.log('Safely closed MongoDB Connection');
    });
};

export default function initializeMongo(argv: any): Promise<{}> {
    return new Promise((resolve, reject) => {
        mongoose.set('debug', argv.debug);

        argv.state = argv.state || {};
        if (argv.state.conn === undefined) {
            mongoose.connect(`mongodb://${argv['mongo-host']}:${argv['mongo-port']}/${argv['mongo-database']}`, {
                server: {
                    poolSize: 12,
                    reconnectTries: 100,
                    socketOptions: {
                        keepAlive: 300000,
                        connectTimeoutMS: 30000
                    }
                }
            });

            argv.state.conn = mongoose.connection;
            const db: mongoose.Connection = argv.state.conn;
            db.on('error', () => {
                console.error(console, 'Database connection error:');
                reject(new Error('Error connecting to Mongo'));
            });
            db.on('connected', () => {
                console.log('Connected to Mongo');
                lookupConfiguration(argv)
                    .then(() => resolve('Mongo DB running'))
                    .catch((errMsg) => reject(errMsg));
            });
            db.on('disconnected', () => console.log('Disconnected from Mongo'));

            argv.state.refreshTimer = setTimeout(() => {
                refreshConfiguration(argv);
            }, argv['refresh-interval'] * 60 * 1000);

            process.on('SIGINT', () => shutdownDatabase(db, argv));
            process.on('SIGTERM', () => shutdownDatabase(db, argv, -9));
        }
    });
}
