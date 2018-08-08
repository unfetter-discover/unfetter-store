import * as FeedParser from 'feedparser';
import * as UUID from 'uuid';
import { Stix } from '../models/stix';
import { StixLookupMongoService } from '../services/stix-lookup-mongo.service';
import { StixLookupService } from '../services/stix-lookup.service';

/**
 * @description
 *  Mapping keys from rss datamodel to stix
 */
export class RssToStixAdapter {

    protected lookupService: StixLookupService;
    constructor() {
        this.lookupService = new StixLookupMongoService();
    }

    public setLookupService(service: StixLookupService): void {
        this.lookupService = service;
    }

    /**
     * @description map item
     * @param {FeedParser.Item} item
     * @return {Promise<Stix[]>} stix from given array
     */
    public async convertRssToStix(arr: FeedParser.Item[]): Promise<Stix[]> {
        const systemIdentity = await this.lookupService.findSystemIdentity();
        const systemIdentityId = systemIdentity.stix.id;
        console.log('found id', systemIdentityId);
        const stixies = arr
            .map((el) => this.mapItemToStix(el, systemIdentityId));
        return Promise.all(stixies);
    }

    /**
     * @description map item
     * @param {FeedParser.Item} item
     */
    private async mapItemToStix(item: FeedParser.Item, systemIdentityId: string): Promise<Stix> {
        const stix = new Stix();
        stix.type = 'report';

        if (!item) {
            return stix;
        }

        if (item.title) {
            stix.title = item.title;
            stix.name = item.title;
        }

        const id = UUID.v4();
        stix.id = stix.type + '--' + id;
        const sourceType = 'open source';
        const reportId = item.guid;
        const description = item.description;
        stix.description = item.description;
        if (reportId || sourceType || description) {
            const externalRef = {
                external_id: reportId,
                url: item.link,
                source_name: sourceType,
                description,
            };
            stix.external_references = stix.external_references || [];
            stix.external_references.push(externalRef);
        }
        stix.created_by_ref = systemIdentityId || item.author;
        const createdDate = item.date ? new Date(item.date) : new Date();
        stix.created = createdDate.toISOString();
        return stix;
    }

}
