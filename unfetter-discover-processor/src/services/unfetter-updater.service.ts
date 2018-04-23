import MongooseModels from '../models/mongoose-models';

export default class UnfetterUpdaterService {

    /**
     * @param  {any[]} stixToUpload
     * @returns Promise
     * @description Generates a list of STIX that needs to be upserted based off of modified or modified_at_ingest dates
     */
    public static getMatchingDocs(stixToUpload: any[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const stixIds = stixToUpload.map((stix) => stix._id);

            MongooseModels.stixModel.find({ _id: { $in: stixIds }}, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    const savedStix = results
                        .map((r) => r.toObject())
                        // Some sample STIX does not have a modified date
                        .filter((s) => !!s.modified);

                    const stixToUpsert = stixToUpload
                        .filter((stix) => {
                            try {
                                const loadedDoc = savedStix.find((doc) => doc._id === stix._id);
                                if (loadedDoc) {
                                    const modifiedDate: string = stix.stix.modified;
                                    const loadedModified: string = loadedDoc.stix.modified ? loadedDoc.stix.modified.toISOString() : '';
                                    const modifiedAtIngest: string = loadedDoc.metaProperties && loadedDoc.metaProperties && loadedDoc.metaProperties.modified_at_ingest && loadedDoc.metaProperties.modified_at_ingest ? loadedDoc.metaProperties.modified_at_ingest.toISOString() : '';
                                    if (modifiedDate === loadedModified || modifiedDate === modifiedAtIngest) {
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
                        });
                    resolve(stixToUpsert);
                }
            });
        });
    }
}
