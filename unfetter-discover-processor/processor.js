/* ~~~ Program Constants ~~~ */
const HttpsProxyAgent = require('https-proxy-agent');
// The maximum amount of tries mongo will attempt to connect
const MAX_NUM_CONNECT_ATTEMPTS = process.env.MAX_NUM_CONNECT_ATTEMPTS || 10;
// The amount of time between each connection attempt in ms
const CONNECTION_RETRY_TIME = process.env.CONNECTION_RETRY_TIME || 5000;
const MITRE_STIX_URL = 'https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json';
const PROCESSOR_STATUS_ID = process.env.PROCESSOR_STATUS_ID || 'f09ad23d-c9f7-40a3-8afa-d9560e6df95b';

/* ~~~ Vendor Libraries ~~~ */

const fs = require('fs');
const mongoose = require('mongoose');
const fetch = require('node-fetch');
const url = require('url');
const argv = require('yargs')

    .alias('h', 'host')
    .describe('h', 'Host name and/or IP address for MongoDB')
    .default('h', process.env.MONGO_HOST || 'localhost')

    .alias('d', 'database')
    .describe('d', 'Database for MongoDB')
    .default('d', process.env.MONGO_DB || 'stix')

    .alias('p', 'port')
    .describe('p', 'Port for MongoDB')
    .default('p', process.env.MONGO_PORT || 27017)

    .alias('s', 'stix')
    .describe('s', 'File paths for STIX bundles (0 to n)')
    .array('s')

    .alias('e', 'enhanced-stix-properties')
    .describe('e', 'File paths for enhanced STIX properties bundles (0 to n).  Must map to a an existing STIX id')
    .array('e')

    .alias('c', 'config')
    .describe('c', 'File paths for configuration files (0 to n)')
    .array('c')

    .alias('m', 'mitre-attack-data')
    .describe('m', 'Option to upload STIX data from Mitre ATT&CK\'s github')
    .choices('m', ['enterprise', 'pre', 'mobile'])
    .array('m')

    .alias('a', 'auto-publish')
    .describe('a', 'Auto publish STIX to all organizations')
    .boolean('a')
    .default('a', process.env.AUTO_PUBLISH || true)

    .help('help')
    .argv;

/* ~~~ Local Imports ~~~ */

const stixModel = mongoose.model('stix', new mongoose.Schema({
    _id: String,
    stix: {
        created: Date,
        modified: Date,
        first_seen: Date,
        last_seen: Date,
        published: Date,
        valid_from: Date,
        valid_until: Date,
        first_observed: Date,
        last_observed: Date
    }
}, {
    strict: false
}), 'stix');
const configModel = mongoose.model('config', new mongoose.Schema({
    _id: String
}, {
    strict: false
}), 'config');
const utilModel = mongoose.model('utility', new mongoose.Schema({
    _id: String
}, {
    strict: false
}), 'utility');

/* ~~~ Utility Functions ~~~ */

function readJson(filePath) {
    let json;
    if (fs.existsSync(filePath)) {
        const string = fs.readFileSync(filePath, 'utf-8');
        json = JSON.parse(string);
    } else {
        console.log(`File Path [${filePath}] not found`);
    }
    return json;
}

function filesToJson(filePaths) {
    return filePaths
        .map(filePath => readJson(filePath))
        .filter(jsonObj => jsonObj);
}

function getMitreData() {
    const instanceOptions = {};

    if (process.env.HTTPS_PROXY_URL && process.env.HTTPS_PROXY_URL !== '') {
        console.log('Attempting to configure proxy');
        const proxy = url.parse(process.env.HTTPS_PROXY_URL);
        // Workaround for UNABLE_TO_GET_ISSUER_CERT_LOCALLY fetch error due to proxy + self-signed cert
        proxy.rejectUnauthorized = false;
        instanceOptions.agent = new HttpsProxyAgent(proxy);
    } else {
        console.log('Not using a proxy');
    }

    return new Promise((resolve, reject) => {
        fetch(mitreUrl, instanceOptions)
            .then(fetchRes => fetchRes.json())
            .then(fetchRes => {
                const stixToUpload = fetchRes.objects
                    .map(stix => {
                        const retVal = {};
                        retVal._id = stix.id;
                        retVal.stix = {};
                        for (const prop in stix) {
                            if (prop.match(/^x_/) !== null) {
                                if (retVal.extendedProperties === undefined) {
                                    retVal.extendedProperties = {};
                                }
                                retVal.extendedProperties[prop] = stix[prop];
                            } else {
                                retVal.stix[prop] = stix[prop];
                            }
                        }
                        return retVal;
                    });
                resolve(stixToUpload);
            })
            .catch(err => reject(err));
    });
}

/* ~~~ Main Function ~~~ */
const promises = [];

function run(stixObjects = []) {
    // STIX files
    if (argv.stix !== undefined) {
        console.log('Processing the following STIX files: ', argv.stix);
        const stixToUpload = filesToJson(argv.stix)
            .map(bundle => bundle.objects)
            .reduce((prev, cur) => prev.concat(cur), [])
            .map(stix => {
                const retVal = {};
                retVal._id = stix.id;
                retVal.stix = stix;
                return retVal;
            })
            .concat(stixObjects);

        // Enhanced stix files
        if (argv.enhancedStixProperties !== undefined) {
            console.log('Processing the following enhanced STIX properties files: ', argv.enhancedStixProperties);
            const enhancedPropsToUpload = filesToJson(argv.enhancedStixProperties)
                .reduce((prev, cur) => prev.concat(cur), []);

            enhancedPropsToUpload.forEach(enhancedProps => {
                const stixToEnhance = stixToUpload.find(stix => stix._id === enhancedProps.id);
                if (stixToEnhance) {
                    if (enhancedProps.extendedProperties !== undefined) {
                        stixToEnhance.extendedProperties = enhancedProps.extendedProperties;
                    }

                    if (enhancedProps.metaProperties !== undefined) {
                        stixToEnhance.metaProperties = enhancedProps.metaProperties;
                    }
                } else {
                    // TODO attempt to upload to database if not in processed STIX document
                    console.log('STIX property enhancement failed - Unable to find matching stix for: ', enhancedProps._id);
                }
            });
        }
        promises.push(stixModel.create(stixToUpload));
    } else if (argv.enhancedStixProperties !== undefined) {
        // TODO attempt to upload to database if not STIX document provided
        console.log('Enhanced STIX files require a base STIX file');
    }


    // Config files
    if (argv.config !== undefined) {
        console.log('Processing the following configuration files: ', argv.config);
        const configToUpload = filesToJson(argv.config)
            .reduce((prev, cur) => prev.concat(cur), []);
        promises.push(configModel.create(configToUpload));
    }

    if (promises !== undefined && promises.length) {
        Promise.all(promises)
            .then(results => { // eslint-disable-line no-unused-vars
                console.log('Successfully executed all operations');
                // eslint-disable-next-line no-unused-vars
                utilModel.findByIdAndUpdate(PROCESSOR_STATUS_ID, {
                    _id: PROCESSOR_STATUS_ID,
                    utilityName: 'PROCESSOR_STATUS',
                    utilityValue: 'COMPLETE'
                }, {
                    upsert: true
                    // eslint-disable-next-line no-unused-vars
                }, (err, res) => {
                    mongoose.connection.close(() => {
                        console.log('closed mongo connection');
                    });
                });
            })
            .catch(err => {
                console.log('Error: ', err.message);
                // eslint-disable-next-line no-unused-vars
                utilModel.findByIdAndUpdate(PROCESSOR_STATUS_ID, {
                    _id: PROCESSOR_STATUS_ID,
                    utilityName: 'PROCESSOR_STATUS',
                    utilityValue: 'COMPLETE'
                }, {
                    upsert: true
                    // eslint-disable-next-line no-unused-vars
                }, (error, res) => {
                    mongoose.connection.close(() => {
                        console.log('closed mongo connection');
                        process.exit(1);
                    });
                });
            });
    } else {
        console.log('There are no operations to perform');
        // eslint-disable-next-line no-unused-vars

        utilModel.findByIdAndUpdate(PROCESSOR_STATUS_ID, {
            _id: PROCESSOR_STATUS_ID,
            utilityName: 'PROCESSOR_STATUS',
            utilityValue: 'COMPLETE'
        }, {
            upsert: true
            // eslint-disable-next-line no-unused-vars
        }, (err, res) => {
            mongoose.connection.close(() => {
                console.log('closed mongo connection');
            });
        });
    }
}

/* ~~~ Driver ~~~ */
let conIntervel;
let connAttempts = 0;
// let conn;

// Wait for mongoose to connect before processing
mongoose.connection.on('connected', err => { // eslint-disable-line no-unused-vars
    console.log('connected to mongodb');
    clearInterval(conIntervel);

    utilModel.findByIdAndUpdate(PROCESSOR_STATUS_ID, {
        _id: PROCESSOR_STATUS_ID,
        utilityName: 'PROCESSOR_STATUS',
        utilityValue: 'PENDING'
    }, {
        upsert: true
    }, (error, res) => { // eslint-disable-line no-unused-vars
        if (error) {
            mongoose.connection.close(() => {
                console.log('Unable to set processor status');
                process.exit(1);
            });
        } else if (argv.addMitreData !== undefined && argv.addMitreData === true) {
            // Add mitre data
            console.log('Adding Mitre data');
            getMitreData()
                .then(result => {
                    run(result);
                })
                .catch(getMitreDataError => {
                    console.log(getMitreDataError);
                    mongoose.connection.close(() => {
                        console.log('closed mongo connection');
                        process.exit(1);
                    });
                });
        } else {
            run();
        }
    });
});
mongoose.connection.on('error', err => {
    console.log(`Mongoose connection error: ${err}`);
    if (connAttempts >= MAX_NUM_CONNECT_ATTEMPTS) {
        clearInterval(conIntervel);
        console.log('Maximum number of connection attempts exceeded. Terminating program.');
        process.exit(1);
    }
});
conIntervel = setInterval(() => {
    connAttempts += 1;
    // conn =
    mongoose.connect(`mongodb://${argv.host}:${argv.port}/${argv.database}`);
}, CONNECTION_RETRY_TIME);
