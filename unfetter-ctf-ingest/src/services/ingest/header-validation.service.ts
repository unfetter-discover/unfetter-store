import * as camelcase from 'camelcase';

import { CollectionType } from '../collection-type.enum';
import { MongoConnectionService } from '../mongo-connection.service';

/**
 * @description ensure the headers given are matching and expected to our target object
 *  this can be helpful to catch before we start any processing.  Note that individual rows
 *  may still have incorrect values during parse time.
 */
export class HeaderValidationService {

    /**
     * @description look for an overlap between the headers given and the object shape
     *   if at least one overlap exists, then valid is true
     * @param {string[]} targetKeys
     * @param {string[]} headers
     * @param {boolean} strict, require all headers to be expected
     * @return {Promise<boolean>}
     */
    public async verifyCorrectHeaders(
        targetKeys: string[] = [],
        headers: string[] = [], strict = false): Promise<boolean> {

        let valid = false;
        if (targetKeys.length < 1 || headers.length < 1) {
            return false;
        }

        if (strict === true) {
            valid = await this.completeOverlap(targetKeys, headers);
        } else {
            valid = await this.partialOverlap(targetKeys, headers);
        }

        return Promise.resolve(valid);
    }

    protected async completeOverlap(expectedKeysArr: string[], headers: string[]): Promise<boolean> {
        const seenKeySet = new Set<string>();
        const allHeadersGood = headers.every((header) => {
            const camelKey = camelcase(header);
            seenKeySet.add(camelKey);
            return expectedKeysArr.findIndex((el) => el === camelKey) > -1;
        });

        const allKeysSeen = expectedKeysArr.every((expectedKey) => seenKeySet.has(expectedKey));
        return allHeadersGood && allKeysSeen;
    }

    protected async partialOverlap(keys: string[], headers: string[]): Promise<boolean> {
        return headers.some((header) => {
            const camelKey = camelcase(header);
            return keys.findIndex((el) => el === camelKey) > -1;
        });
    }

}
