/* ~~~ Vendor Libraries ~~~ */

import * as mongoose from 'mongoose';

/* ~~~ Local Imports ~~~ */

import filesToJson from './adapters/files.adapter';
import MongooseModels from './models/mongoose-models';
import mongoInit from './services/mongoose-connection.service';
import argv from './services/cli.service';
import getMitreData from './services/mitre-data.service';
import StixToUnfetterAdapater from './adapters/stix-to-unfetter.adapter';
import ProcessorStatusService from './services/processor-status.service';
import ProcessorStatus from './models/processor-status.emum';
import UnfetterUpdaterService from './services/unfetter-updater.service';

/* ~~~ Main Function ~~~ */

/**
 * @param  {any=[]} stixObjects
 * @description Main driver function
 */
async function run(stixObjects: any = []) {
    let _error: any;
    try {
        const promises: Array<Promise<any>> = [];
        // STIX files
        if (argv.stix !== undefined) {
            console.log('Processing the following STIX files: ', argv.stix);
            const stixToUpload = filesToJson(argv.stix)
                .map((bundle: any) => bundle.objects)
                .reduce((prev: any, cur: any) => prev.concat(cur), [])
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
                    .reduce((prev: any, cur: any) => prev.concat(cur), []);

                StixToUnfetterAdapater.enhanceStix(stixToUpload, enhancedPropsToUpload);
            }

            if (argv['auto-publish']) {
                StixToUnfetterAdapater.autoPublish(stixToUpload);
            }

            // Record modified date at startup
            StixToUnfetterAdapater.saveModified(stixToUpload);

            // Find docs tagged for updating
            const [ updateDocIds, updatePromises ] = await UnfetterUpdaterService.generateUpdates(stixToUpload);
            promises.concat(updatePromises);
            // Remove stixToUpload tagged for updating
            UnfetterUpdaterService.removeUpdateDocs(stixToUpload, updateDocIds);

            promises.push(MongooseModels.stixModel.create(stixToUpload));
        } else if (argv.enhancedStixProperties !== undefined) {
            // TODO attempt to upload to database if not STIX document provided
            console.log('Enhanced STIX files require a base STIX file');
        }

        // Config files
        if (argv.config !== undefined) {
            console.log('Processing the following configuration files: ', argv.config);
            const configToUpload = filesToJson(argv.config)
                .reduce((prev: any[], cur: any) => prev.concat(cur), []);
            promises.push(MongooseModels.configModel.create(configToUpload));
        }

        if (promises !== undefined && promises.length) {
            await Promise.all(promises);
            console.log('Successfully executed all operations');
        } else {
            console.log('There are no operations to perform');            
        }    
    } catch (error) {
        // Ignore if `E11000 duplicate key error collection`
        if (error.code && error.code === 11000) {
            console.log('Warning: There was an attempt to insert documents with duplicate keys - These documents were NOT updated.');
        } else {
            _error = error;
            console.log(error);
        }
    } finally {
        try {            
            await ProcessorStatusService.updateProcessorStatus(ProcessorStatus.COMPLETE);
        } catch (error) {
            _error = error;
            console.log(error);
        } finally {
            mongoose.connection.close(() => {
                console.log('closed mongo connection');
                if (_error) {
                    process.exit(1);
                }
            });
        }        
    }
}

(async () => {
    let conn;
    try {
        conn = await mongoInit();
        await ProcessorStatusService.updateProcessorStatus(ProcessorStatus.PENDING);
        if (argv.mitreAttackData !== undefined && argv.mitreAttackData.length) {
            console.log('Adding the following Mitre ATT&CK data:', argv.mitreAttackData);
            const mitreData = await getMitreData(argv.mitreAttackData);
            // Add MITRE data
            run(mitreData);
        } else {
            // Local data only
            run();
        }
    } catch (error) {
        if (conn) {
            mongoose.connection.close(() => {
                console.log('Unable to set processor status');
                process.exit(1);
            });
        } else {
            console.log('Error while attempting to initialize mongo: ', error);
        }
    }
})();
