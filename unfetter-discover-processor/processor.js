/* ~~~ Program Constants ~~~ */

// The maximum amount of tries mongo will attempt to connect
const MAX_NUM_CONNECT_ATTEMPTS = 10;
// The amount of time between each connection attempt in ms
const CONNECTION_RETRY_TIME = 5000;
const MITRE_STIX_URL = 'https://raw.githubusercontent.com/mitre/cti/master/ATTACK/mitre-attack.json';

/* ~~~ Vendor Libraries ~~~ */

const argv = require('yargs')

    .alias('h', 'host')
    .describe('h', 'Host name and/or IP address for MongoDB')

    .alias('d', 'database')
    .describe('d', 'Database for MongoDB')
    .default('d', 'stix')

    .alias('p', 'port')
    .describe('p', 'Port for MongoDB')
    .default('p', 27017)

    .alias('s', 'stix')
    .describe('s', 'File paths for STIX bundles (0 to n)')
    .array('s')

    .alias('e', 'enhanced-stix-properties')
    .describe('e', 'File paths for enhanced STIX properties bundles (0 to n).  Must map to a an existing STIX id')
    .array('e')

    .alias('c', 'config')
    .describe('c', 'File paths for configuration files (0 to n)')
    .array('c')

    .alias('m', 'add-mitre-data')
    .describe('m', 'Option to uploaded STIX data from Mite\'s github')    
    .boolean('m')

    .help('help')
    .argv;
const fs = require('fs');
const mongoose = require('mongoose');
const fetch = require('node-fetch');

/* ~~~ Local Imports ~~~ */

const stixModel = mongoose.model('stix', new mongoose.Schema({
    _id: String,
    stix: {
        created: Date,
        modified: Date
    }
}, { strict: false }), 'stix');
const configModel = mongoose.model('config', new mongoose.Schema({
    _id: String
}, { strict: false }), 'config');

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
    return new Promise((resolve, reject) => {
        fetch(MITRE_STIX_URL)
            .then(fetchRes => fetchRes.json())
            .then(fetchRes => {
                let stixToUpload = fetchRes.objects
                    .map(stix => {
                        let retVal = {};
                        retVal._id = stix.id;
                        retVal.stix = stix;
                        return retVal;
                    });
                stixModel.create(stixToUpload, (err, mongoRes) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(mongoRes);
                    }
                });
            })
            .catch(err => reject(err));
    })
}

/* ~~~ Driver ~~~ */

let connAttempts = 0;
let conn;
let promises = [];
// Wait for mongoose to connect before processing
mongoose.connection.on('connected', function (err) {
    console.log('connected to mongodb');
    clearInterval(conIntervel);

    // STIX files
    if (argv['stix'] !== undefined) {
        console.log('Processing the following STIX files: ', argv.stix);
        let stixToUpload = filesToJson(argv.stix)
            .map(bundle => bundle.objects)
            .reduce((prev, cur) => prev.concat(cur), [])
            .map(stix => {
                let retVal = {};
                retVal._id = stix.id;
                retVal.stix = stix;
                return retVal;
            });
        promises.push(stixModel.create(stixToUpload));
    } 

    // Enhanced stix files
    if (argv.enhancedStixProperties !== undefined) {
        console.log('Processing the following enhanced STIX properties files: ', argv.enhancedStixProperties);
        if(promises.length) {
            let stixArr = promises[0];
            // TODO update STIX in STIX arr if they exist
        }
        // TODO find and update existing records in mongo
    } 

    // Config files
    if (argv.config !== undefined) {
        console.log('Processing the following configuration files: ', argv.config);
        let configToUpload = filesToJson(argv.config);
        promises.push(configModel.create(configToUpload));
    } 

    // Add mitre data
    if (argv.addMitreData !== undefined && argv.addMitreData === true) {
        console.log('Adding Mitre data');
        promises.push(getMitreData());
    }

    if (promises !== undefined && promises.length) {
        Promise.all(promises)
            .then(results => {
                console.log('Successfully executed all operations');
                mongoose.connection.close(() => {
                    console.log('closed mongo connection');
                });
            })
            .catch(err => {
                console.log('Error: ', err.message);
                mongoose.connection.close(() => {
                    console.log('closed mongo connection');
                });
            })
    } else {
        mongoose.connection.close(() => {
            console.log('closed mongo connection');
        });
    }
});
mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
    if (connAttempts >= MAX_NUM_CONNECT_ATTEMPTS) {
        clearInterval(conIntervel);
        console.log('Maximum number of connection attempts exceeded. Terminating program.');
    }
});
let conIntervel = setInterval(() => {
    connAttempts++;
    conn = mongoose.connect(`mongodb://${argv['host']}:${argv['port']}/${argv['database']}`);
}, CONNECTION_RETRY_TIME);

console.dir(argv);