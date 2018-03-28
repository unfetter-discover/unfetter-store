import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';
import * as UUID from 'uuid';
import { Environment } from '../environment';
import { Stix } from '../models/stix';
import { MongoConnectionService } from './mongo-connection.service';

/**
 * @description class to post stix objects to UNFETTER API
 */
export class UnfetterPosterMongoService {

    /**
     * @description write stix object to mongo directly, no validation
     * @param arr
     * @return {Promise<void>}
     */
    public async uploadStix(arr: Stix[] = []): Promise<void> {
        if (!arr || arr.length < 1) {
            return;
        }
        console.log(`inserting ${arr.length} stix objects`);
        const collection = await MongoConnectionService.getCollection();

        // generate id and wrap in stix
        const wrappedArr: WrappedStix[] = arr.map((el) => {
            if (!el.id) {
                const v4 = UUID.v4();
                const id = el.type + '-' + v4;
                el.id = id;
            }
            const wrapper: WrappedStix = {
                _id: el.id,
                id: el.id,
                stix: Object.assign({}, el),
            };
            return wrapper;
        });

        return Promise.resolve(collection.insertMany(wrappedArr)
            .then((res: any) => {
                console.log(res.result);
                console.log(`inserted ${res.insertedCount} objects`);
                console.log(res);
            })
            .catch((err: any) => console.log(err)));
    }

}

interface WrappedStix {
    _id: string;
    id: string;
    stix: Stix;
}
