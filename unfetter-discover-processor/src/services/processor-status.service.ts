const PROCESSOR_STATUS_ID = process.env.PROCESSOR_STATUS_ID || 'f09ad23d-c9f7-40a3-8afa-d9560e6df95b';

import ProcessorStatus from '../models/processor-status.emum';
import MongooseModels from '../models/mongoose-models';

export default class ProcessorStatusService {
    
    /**
     * @param  {ProcessorStatus} status
     * @returns Promise
     * @description Updates processor status in DB
     */
    public static updateProcessorStatus(status: ProcessorStatus): Promise<any> {
        return new Promise((resolve, reject) => {
            MongooseModels.utilModel.findByIdAndUpdate(PROCESSOR_STATUS_ID, {
                _id: PROCESSOR_STATUS_ID,
                utilityName: 'PROCESSOR_STATUS',
                utilityValue: status
            }, {
                upsert: true
            }, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });        
    }
}
