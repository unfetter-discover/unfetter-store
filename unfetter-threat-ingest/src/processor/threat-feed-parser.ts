import * as fs from 'fs';
import * as vm from 'vm';
import { Document } from 'mongoose';

import ReportJSON from './report-json';
import { DaemonState, FeedSource } from '../models/server-state';

export type DefaultMatchFunction = (report: ReportJSON, board: any) => boolean;

/**
 * Threat feed parsers read in data from a feed that is expected to follow a certain type, such as XML. They can be
 * strict or lenient. The result is that they return data in a Report JSON format (see interface).
 * 
 * If someone has unique parsing needs, even if the content of the feed matches an existing parser, such as XML, they
 * should create a new parser, with a distinct type (say, 'xml-myfeed', or whatever unique name you like), and set
 * the feed configuration to use that new type. An example of a custom parser would be knowing that a particular feed
 * provides associations to existing STIX objects, and adds relationships
 * 
 * Parsers are automatically loaded. First, the system will check the processor directory and any subdirectories. That
 * directory will contain "standard" parsers. The simple XML parser is one. Next, it will search for a dist/plugins
 * directory and any subdirectories. That directory does not normally exist, but site deployments of the service should
 * feel free to inject such a path with whatever custom parsers you need.
 * 
 * There is currently no means to associate reports with other STIX data. So a report that is relevant to certain
 * malware or attack patterns cannot have those relationships ingested along with it. This is something we really
 * need to address, possibly modifying the report definition to include a relationships list.
 */
export abstract class ThreatFeedParser {

    /**
     * All parsers should have some arbitrary type, such as "xml", that is unique from all other parsers in the system.
     * If you give the parser a non-distinct name, it may not get loaded at all. Default parsers are loaded first, so
     * definitely do not give your parser the same name as a default one.
     */
    protected constructor(
        private _type: string,
    ) {
        if (!this._type) {
            throw new Error('');
        }
    }

    public get type() { return this._type; };

    /**
     * This is the one method you are required to override. Take the given, full response body from the given feed,
     * and parse it out into ReportJSON objects. The state is provided mostly for its debug configuration value.
     */
    public abstract parse(data: string, feed: any, state: DaemonState): Promise<ReportJSON[]>;

    /**
     * This method compares the read report against the given board's boundaries. You are not required to override this
     * method, but the default behavior only compares the board's start and end date rangae against the publish date of
     * the report. So if you want to give this feed a chance of providing some decent relevance of the report to a
     * board; then, a) try to extract some kind of detail out of the report, and b) match it up against a malware,
     * or target, or intrusion set.
     */
    public match: null | DefaultMatchFunction = null;

}

/**
 * A collection of threat feed parsers. This object attempts to load ThreatFeedParser definitions from here, and
 * deployed into the service dynamically at runtime, allowing sites with unique requirements to parse data, their
 * way, from desired feeds.
 * 
 * You do not need to make an instance of this class. The ingest service will instantiate it on its own.
 */
export class ThreatFeedParsers {

    private readonly parsers: {[key: string]: ThreatFeedParser} = {};

    private readonly file_matcher = new RegExp(/threat\-feed\-(.*)\-parser\.js$/);

    constructor(
    ) {
        this.loadParsers();
    }

    public getParser(type: string) {
        return this.parsers[type.toLowerCase()];
    }

    private loadParsers() {
        this.findParsers('dist/processor'); // This is where our default parsers will exist
        this.findParsers('dist/plugins');   // This is where other sites can drop new parsers (using Docker or Ansible)
    }

    private findParsers(path: string) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach((entry) => {
                if (fs.statSync(`${path}/${entry}`).isDirectory()) { // TODO in Node v10.10, we can streamline this
                    this.findParsers(`${path}/${entry}`);
                } else {
                    let typed = this.file_matcher.exec(entry);
                    if ((typed !== null) && (typed.length > 1)) {
                        const type = typed[1].toLowerCase();
                        const content = fs.readFileSync(`${path}/${entry}`);
                        const parser = vm.runInNewContext(content.toString(), { require, console, exports: {} });
                        if (parser && parser.type && (type === parser.type.toLowerCase())) {
                            this.parsers[type] = parser;
                        } else {
                            console.warn(`Not a valid '${type}' parser:`, entry);
                        }
                    }
                }
            });
        } else {
            console.debug('No such path', path);
        }
    }

}
