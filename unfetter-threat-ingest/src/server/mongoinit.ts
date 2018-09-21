import mongoose = require('mongoose');
mongoose.Promise = global.Promise;

import * as modelFactory from '../models/modelFactory';

import * as yargs from 'yargs';
import { DaemonState, StatusEnum, PromisedService } from '../models/server-state';

export type MongoConnection = PromisedService<mongoose.Connection>;
type PromiseResolve = (value: MongoConnection) => void;
type PromiseReject = (reason?: any) => void;

const connect = (state: DaemonState, options: yargs.Arguments, resolve: PromiseResolve, reject: PromiseReject) => {
    mongoose.connect(`mongodb://${options['mongo-host']}:${options['mongo-port']}/${options['mongo-database']}`, {
        server: {
            poolSize: 12,
            reconnectTries: 100,
            socketOptions: {
                keepAlive: 300000,
                connectTimeoutMS: 30000
            }
        }
    });

    state.db.conn = mongoose.connection;
    const db: mongoose.Connection = state.db.conn;
    db.on('error', () => {
        console.error(console, 'Database connection error');
        reject(new Error('Error connecting to Mongo'));
    });
    db.on('connected', () => {
        console.log('Connected to Mongo');
        lookupConfiguration(state, options)
            .then(() => resolve(new PromisedService('Mongo DB running', db)))
            .catch((errMsg) => reject(errMsg));
    });
    db.on('disconnected', () => {
        console.warn('Disconnected from Mongo');
        state.db.conn = undefined;
    });

    state.db.status.next(StatusEnum.RUNNING);
};

/**
 * @description populate global configuration
 */
const lookupConfiguration = (state: DaemonState, options: yargs.Arguments) => new Promise((resolve, reject) => {
    if (options.debug) {
        console.debug('Looking up configuration');
    }
    const ConfigModel = modelFactory.getModel('config');
    const configuration: any = Object.assign({}, options);
    ConfigModel.find({ configGroups: 'feed' }, { configKey: 1, configValue: 1, _id: 0 }, (err, configurations) => {
        if (err) {
            reject(new Error(`Unable to get configurations: ${err}`));
        } else if (!configurations) {
            reject(new Error('No feed configuration data found'))
        } else {
            configurations.forEach((configItem: any) => {
                const configObject = configItem.toObject();
                configuration[configObject.configKey] = configObject.configValue;
            });
            validateConfiguration(configuration);
            state.configuration = configuration;
            if (state.configuration.debug) {
                console.debug('Read configuration from Mongo:', state.configuration);
            }
            resolve('Configuration received');
        }
        state.db.refreshTimer = setTimeout(() => onRefresh(state, options),
                (state.configuration['refresh-interval'] || options['refresh-interval']) * 60 * 1000);
    });
});

const onRefresh = (state: DaemonState, options: yargs.Arguments) => {
    if (state.db.refreshTimer) {
        clearTimeout(state.db.refreshTimer);
        state.db.refreshTimer = undefined;
    }
    if (!state.db.conn) {
        connect(state, options, (service) => console.log(service.response), (err) => console.warn);
    } else {
        if (options.debug) {
            console.debug('Reloading configuration');
        }
        lookupConfiguration(state, options)
            .then(() => {
                if (state.configuration.debug) {
                    console.debug('Configuration refreshed');
                }
            })
            .catch((errMsg) => {
                console.error('Configuration was not refreshed:', errMsg);
            });
    }
}

const onShutdown = (state: DaemonState) => {
    if (state.db.refreshTimer) {
        clearTimeout(state.db.refreshTimer);
        state.db.refreshTimer = undefined;
    }
    if (state.db.conn) {
        state.db.status.next(StatusEnum.STOPPING);
        state.db.conn.close(() => {
            state.db.conn = undefined;
            console.log('Safely closed MongoDB Connection');
            state.db.status.next(StatusEnum.SHUTDOWN);
        });
    } else {
        state.db.status.next(StatusEnum.SHUTDOWN);
    }
};

const validateConfiguration = (config: any) => {
    if (!config['refresh-interval'] || (config['refresh-interval'] <= 0)) {
        config['refresh-interval'] = 30;
    }
    if (!config['poll-interval'] || (config['poll-interval'] <= 0)) {
        config['poll-interval'] = 3;
    }
}

const validateOptions = (options: yargs.Arguments) => {
    if (!options['mongo-host']) {
        options['mongo-host'] = 'localhost';
    }
    if (!options['mongo-port'] || (options['mongo-port'] <= 0)) {
        options['mongo-port'] = 27017;
    }
    if (!options['mongo-database']) {
        options['mongo-database'] = 'stix';
    }
}

export default function initializeMongo(state: DaemonState, options: yargs.Arguments): Promise<MongoConnection> {
    return new Promise((resolve, reject) => {
        mongoose.set('debug', options.debug);

        if (state.db.conn === undefined) {
            state.db.status.next(StatusEnum.INITIALIZING);

            connect(state, options, resolve, reject);
        }

        state.db.refresh = onRefresh;

        process.on('SIGINT', () => onShutdown(state));
        process.on('SIGTERM', () => onShutdown(state));
    });
}
