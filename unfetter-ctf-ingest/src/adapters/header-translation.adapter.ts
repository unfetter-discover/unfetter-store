import * as camelcase from 'camelcase';
import { CollectionType } from '../services/collection-type.enum';
import { MongoConnectionService } from '../services/mongo-connection.service';
import { StixLookupMongoService } from '../services/stix-lookup-mongo.service';
import { StixLookupService } from '../services/stix-lookup.service';

/**
 * @description reads headers and rewrites them
 */
export class HeaderTranslationAdapter {

    protected lookupService: StixLookupService;
    constructor() {
        this.lookupService = new StixLookupMongoService();
    }

    public setLookupService(service: StixLookupService): void {
        this.lookupService = service;
    }

    /**
     * @description rewrites headers based on config table for the given system name
     *  if no config for system name is found, returns headers unchanged
     * @param {string} systemName
     * @param {string[]} headers
     */
    public async translateHeaders(systemName: string, headers: string[]): Promise<string[]> {
        if (!systemName || systemName.trim().length === 0) {
            return Promise.resolve(headers);
        }

        const headerTranslation = await this.lookupService.findHeaderTranslationRules(systemName);
        const rules = headerTranslation.rules;
        if (!rules) {
            return Promise.resolve(headers);
        }
        const translated = headers.map((header) => {
            const translate = rules.find((rule) => {
                return rule.header === header;
            });
            if (translate !== undefined) {
                return translate.rewrite;
            } else {
                return header;
            }
        });
        return Promise.resolve(translated);
    }

}
