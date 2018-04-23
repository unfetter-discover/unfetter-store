import MongooseModels from '../models/mongoose-models';

export default class UnfetterUpdaterService {

    /**
     * @param  {any[]} stixToUpload
     * @returns Promise<Array<{old: any, new: any}>>
     * @description Generates a list of STIX that needs to be upserted based off of modified or modified_at_ingest dates
     */
    public static getMatchingDocs(stixToUpload: any[]): Promise<Array<{old: any, new: any}>> {
        return new Promise((resolve, reject) => {
            const stixIds = stixToUpload.map((stix) => stix._id);

            MongooseModels.stixModel.find({ _id: { $in: stixIds }}, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    const savedStix = results
                        .map((r) => r.toObject())
                        // Some sample STIX does not have a modified date
                        .filter((s) => !!s.stix.modified);

                    const stixToUpate: Array<{old: any, new: any}> = stixToUpload
                        .filter((stix) => {
                            try {
                                const loadedDoc = savedStix.find((doc) => doc._id === stix._id);
                                const modifiedDate: Date = stix.stix.modified ? new Date(stix.stix.modified) : null;
                                if (loadedDoc || !modifiedDate) {
                                    const loadedModified: Date = loadedDoc.stix.modified;
                                    const modifiedAtIngest: Date = loadedDoc.metaProperties 
                                        && loadedDoc.metaProperties
                                        && loadedDoc.metaProperties.modified_at_ingest 
                                        && loadedDoc.metaProperties.modified_at_ingest 
                                        ? loadedDoc.metaProperties.modified_at_ingest : null;
                                    
                                    // Do not include if modified date is equal or earlier than what is stored
                                    if (modifiedDate && (modifiedDate <= loadedModified || modifiedDate <= modifiedAtIngest)) {
                                        return false;
                                    }
                                    return true;
                                } else {
                                    return false;
                                }
                            } catch (error) {
                                // Incase date conversion fails
                                return false;                                
                            }                            
                        })
                        .map((stix) => {
                            const loadedDoc = savedStix.find((doc) => doc._id === stix._id);
                            return {
                                old: loadedDoc,
                                new: stix
                            };
                        });
                    resolve(stixToUpate);
                }
            });
        });
    }

    /**
     * @param  {any[]} stixToUpload
     * @returns Promise<[string[], Array<Promise<any>>]>
     * @description Generates a list of matching doc IDs, 
     * merges existing documents with the new documents, 
     * and Mongoose update commands to update the existing documents
     */
    public static generateUpserts(stixToUpload: any[]): Promise<[string[], Array<Promise<any>>]> {
        return new Promise((resolve, reject) => {
            this.getMatchingDocs(stixToUpload)
                .then((matchingDocs: Array<{ old: any, new: any }>) => {
                    const docIds: string[] = matchingDocs.map((doc) => doc.new._id);
                    const promises = [];
                    for (const matchingDoc of matchingDocs) {
                        const temp: any = {
                            _id: matchingDoc.old._id,
                            stix: {
                                ...matchingDoc.old.stix,
                                ...matchingDoc.new.stix
                            }
                        };
                        if (matchingDoc.old.extendedProperties || matchingDoc.new.extendedProperties) {
                            temp.extendedProperties = {
                                ...matchingDoc.old.extendedProperties,
                                ...matchingDoc.new.extendedProperties
                            };
                        }
                        if (matchingDoc.old.metaProperties || matchingDoc.new.metaProperties) {
                            temp.metaProperties = {
                                ...matchingDoc.old.metaProperties,
                                ...matchingDoc.new.metaProperties
                            };

                            if (matchingDoc.old.metaProperties.modified_at_ingest) {
                                temp.metaProperties.modified_at_ingest = matchingDoc.old.metaProperties.modified_at_ingest;
                            }
                        }
                        promises.push(MongooseModels.stixModel.findByIdAndUpdate(temp._id, temp).exec());
                    }
                    resolve([docIds, promises]);
                })
                .catch((err) => reject(err));
        });
    }
}
