/* ~~~ Program Constants ~~~ */

const PROCESSOR_STATUS_ID = process.env.PROCESSOR_STATUS_ID || 'f09ad23d-c9f7-40a3-8afa-d9560e6df95b';

/* ~~~ Vendor Libraries ~~~ */

import * as mongoose from 'mongoose';
import * as yargs from 'yargs';

/* ~~~ Local Imports ~~~ */

import filesToJson from './adapters/files.adapter';
import MongooseModels from './models/mongoose-models';
import mongoInit from './services/mongoose-connection.service';
import argv from './services/cli.service';
import getMitreData from './services/mitre-data.service';

/* ~~~ Main Function ~~~ */

function run(stixObjects: any = []) {
    const promises = [];
    // STIX files
    if (argv.stix !== undefined) {
        console.log('Processing the following STIX files: ', argv.stix);
        const stixToUpload = filesToJson(argv.stix)
            .map((bundle: any) => bundle.objects)
            .reduce((prev: any, cur) => prev.concat(cur), [])
            .map((stix: any) => {
                const retVal: any = {};
                retVal._id = stix.id;
                retVal.stix = stix;
                return retVal;
            })
            .concat(stixObjects);

        // Enhanced stix files
        if (argv.enhancedStixProperties !== undefined) {
            console.log('Processing the following enhanced STIX properties files: ', argv.enhancedStixProperties);
            const enhancedPropsToUpload = filesToJson(argv.enhancedStixProperties)
                .reduce((prev: any, cur) => prev.concat(cur), []);

            enhancedPropsToUpload.forEach((enhancedProps: any) => {
                const stixToEnhance = stixToUpload.find((stix: any) => stix._id === enhancedProps.id);
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

        if (argv['auto-publish']) {
            stixToUpload.forEach((stix: any) => {
                if (stix.metaProperties === undefined) {
                    stix.metaProperties = {};
                }
                stix.metaProperties.published = true;
            });
        }

        promises.push(MongooseModels.stixModel.create(stixToUpload));
    } else if (argv.enhancedStixProperties !== undefined) {
        // TODO attempt to upload to database if not STIX document provided
        console.log('Enhanced STIX files require a base STIX file');
    }

    // Config files
    if (argv.config !== undefined) {
        console.log('Processing the following configuration files: ', argv.config);
        const configToUpload = filesToJson(argv.config)
            .reduce((prev: any[], cur) => prev.concat(cur), []);
        promises.push(MongooseModels.configModel.create(configToUpload));
    }

    if (promises !== undefined && promises.length) {
        Promise.all(promises)
            .then((results) => {
                console.log('Successfully executed all operations');
                MongooseModels.utilModel.findByIdAndUpdate(PROCESSOR_STATUS_ID, {
                    _id: PROCESSOR_STATUS_ID,
                    utilityName: 'PROCESSOR_STATUS',
                    utilityValue: 'COMPLETE'
                }, {
                        upsert: true
                    }, (err, res) => {
                        mongoose.connection.close(() => {
                            console.log('closed mongo connection');
                        });
                    });
            })
            .catch((err) => {
                console.log('Error: ', err.message);
                MongooseModels.utilModel.findByIdAndUpdate(PROCESSOR_STATUS_ID, {
                    _id: PROCESSOR_STATUS_ID,
                    utilityName: 'PROCESSOR_STATUS',
                    utilityValue: 'COMPLETE'
                }, {
                        upsert: true
                    }, (error, res) => {
                        mongoose.connection.close(() => {
                            console.log('closed mongo connection');
                            process.exit(1);
                        });
                    });
            });
    } else {
        console.log('There are no operations to perform');

        MongooseModels.utilModel.findByIdAndUpdate(PROCESSOR_STATUS_ID, {
            _id: PROCESSOR_STATUS_ID,
            utilityName: 'PROCESSOR_STATUS',
            utilityValue: 'COMPLETE'
        }, {
                upsert: true
            }, (err, res) => {
                mongoose.connection.close(() => {
                    console.log('closed mongo connection');
                });
            });
    }
}

mongoInit()
    .then((conn) => {
        MongooseModels.utilModel.findByIdAndUpdate(PROCESSOR_STATUS_ID, {
            _id: PROCESSOR_STATUS_ID,
            utilityName: 'PROCESSOR_STATUS',
            utilityValue: 'PENDING'
        }, {
            upsert: true
        }, (error, res) => {
            if (error) {
                conn.close(() => {
                    console.log('Unable to set processor status');
                    process.exit(1);
                });
            } else if (argv.mitreAttackData !== undefined && argv.mitreAttackData.length) {
                // Add mitre data
                console.log('Adding the following Mitre ATT&CK data:', argv.mitreAttackData);
                getMitreData(argv.mitreAttackData)
                    .then((result: any) => {
                        run(result);
                    })
                    .catch((getMitreDataError) => {
                        console.log(getMitreDataError);
                        conn.close(() => {
                            console.log('closed mongo connection');
                            process.exit(1);
                        });
                    });
            } else {
                run();
            }
        });
    })
    .catch((err) => console.log(err));
