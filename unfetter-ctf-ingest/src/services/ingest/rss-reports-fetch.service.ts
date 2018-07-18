import * as FeedParser from 'feedparser';
import * as fs from 'fs';
import * as request from 'request';
import { RssToStixAdapter } from '../../adapters/rss-to-stix.adapter';
import { Stix } from '../../models/stix';
import { StixLookupMongoService } from '../stix-lookup-mongo.service';
import { StixLookupService } from '../stix-lookup.service';

/**
 * @description reads rss and generates stix 2.0 like reports
 * @see https://www.us-cert.gov/ncas/alerts
 * @see https://www.oasis-open.org/committees/download.php/58538/STIX2.0-Draft1-Core.pdf
 */
export class RssReportsFetchService {

    protected lookupService: StixLookupService;
    protected stixAdapter: RssToStixAdapter;

    constructor() {
        this.lookupService = new StixLookupMongoService();
        this.stixAdapter = new RssToStixAdapter();
    }

    public setLookupService(lookupService: StixLookupService): void {
        this.lookupService = lookupService;
    }

    public setStixAdapter(adapter: RssToStixAdapter): void {
        this.stixAdapter = adapter;
    }

    /**
     * @description fetch rss reports, transform to stix 2.0
     * @param rssUrl
     * @return {Promise<Stix[]>}
     */
    public async fetchLatest(rssUrl = ''): Promise<Stix[]> {
        if (!rssUrl) {
            return Promise.reject('');
        }

        console.log('fetching reports from', rssUrl);
        const items = await this.fetch(rssUrl);
        return this.stixAdapter.convertRssToStix(items);
    }

    /**
     * @description
     * @param {string} fileName
     * @return {Promise<void>}
     */
    public async fetch(rssUrl = ''): Promise<FeedParser.Item[]> {
        if (!rssUrl) {
            return Promise.reject('');
        }

        const promise = new Promise<FeedParser.Item[]>((resolve, reject) => {
            const req = request(rssUrl);
            const options = {
                feedurl: rssUrl,
            };
            const feedparser = new FeedParser(options);

            req.on('error', (err) => reject(err));
            req.on('response', (res) => {
                const self: any = req;
                if (res.statusCode !== 200) {
                    self.emit('error', new Error('Bad status code'));
                } else {
                    // `this` is a `req`, which is a stream
                    const stream: any = self;
                    stream.pipe(feedparser);
                }
            });
            feedparser.on('error', (err: any) => reject(err));

            const items = new Array<FeedParser.Item>();
            feedparser.on('readable', () => {
                // `this` is  `feedparser`, which is a stream
                const stream: any = feedparser;
                // Note: the meta is always availablein the context of the feedparser instance
                const meta = feedparser.meta;
                let item: FeedParser.Item = stream.read();
                while (item) {
                    items.push(item);
                    item = stream.read();
                }
            });

            feedparser.on('end', () => resolve(items));
        });
        return promise;
    }

}
