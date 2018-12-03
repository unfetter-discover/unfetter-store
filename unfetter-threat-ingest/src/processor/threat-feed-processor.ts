import * as https from 'https';
import * as http from 'http';
import * as uuid from 'uuid';
import * as fs from 'fs';
import fetch from 'node-fetch';
import { Document } from 'mongoose';
import { ObjectId } from 'bson';

import ReportJSON from './report-json';
import { ThreatFeedParser } from './threat-feed-parser';
import { DaemonState, StatusEnum } from '../models/server-state';

interface Protocol {
    get: (url: string | any, callback?: (res: http.IncomingMessage) => void) => http.ClientRequest;
};

export default class ThreatFeedProcessor {

    private parser: ThreatFeedParser;

    private urlParser = /(https?:)\/\/(.*?)(:\d+)?(\/.*)/;

    constructor(
        private feed: any,
        private boards: Document[],
        private currentReports: any[],
        private state: DaemonState,
    ) {
        if (this.feed.parser && this.feed.parser.type) {
            this.parser = this.state.processor.parsers.getParser(this.feed.parser.type);
            if (this.parser) {
                console.debug(`Using parser for '${this.feed.parser.type}'`, this.parser.constructor.name);
            } else {
                console.warn(`Found no parser for '${this.feed.parser.type}'`);
            }
        }
    }

    public async poll() {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        let protocol: Protocol = http;
        let request: string | any = null;
        if (typeof this.feed.source === 'string') {
            const parsed = this.urlParser.exec(this.feed.source);
            if (parsed && (parsed.length === 5)) {
                request = {
                    protocol: parsed[1].toLocaleLowerCase(),
                    hostname: parsed[2],
                    port: Number.parseInt(parsed[3]) || 443,
                    path: `/${parsed[4].replace(/s/g, '%20')}`
                };
            } else {
                request = this.feed.source; // if it doesn't parse, try it anyway, but it probably won't work
            }
        } else {
            request = {...this.feed.source};
        }
        if ((typeof this.feed.source !== 'string') && this.feed.options) {
            ['headers', 'auth', 'passphrase', 'requestCert', 'rejectUnauthorized'].forEach((option) => {
                if (this.feed.options[option]) {
                    request[option] = this.feed.options[option];
                }
            });
            ['ca', 'cert', 'key'].forEach((option) => {
                if (this.feed.options[option]) {
                    request[option] = fs.readFileSync(this.feed.options[option]);
                }
            });
        }
        const reports: ReportJSON[] = [];
        await this.pollFeed(protocol, request)
            .then((data) => this.handlePollResolve(data, reports))
            .catch((reason) => {
                /*
                 * Something went wrong trying to contact the feed source.
                 * 
                 * TODO We should probably be keeping track of these, deactivating them if they keep giving us errors, only retrying after many
                 *      cybermoons to see if they've come back. Also send admins a notice, they should know to keep an eye on this.
                 */
                console.warn(`Could not poll feed '${this.feed.name}':`, reason);
            });
        return reports;
    }

    /**
     * Fire the given request to a feed source.
     */
    private pollFeed(protocol: Protocol, req: any) {
        if (this.state.configuration.debug) {
            console.debug('calling feed', req);
        }
        return new Promise((resolve, reject) => {
            const request = protocol.get(req, (res) => {
                let output = '';
                res.on('data', (chunk) => {
                    output += chunk;
                });
                res.on('error', (err) => {
                    reject(err);
                    return;
                });
                res.on('timeout', (timeout) => {
                    reject(timeout);
                    return;
                });
                res.on('end', () => {
                    resolve(output);
                });
            });
            request.on('error', (err) => reject(err));
            request.end();
        });
    };

    /**
     * 
     */
    private handlePollResolve(data: any, reports: ReportJSON[]) {
        if (this.state.processor.status.getValue() !== StatusEnum.RUNNING) {
            /*
             * If this block gets executed, it is because we were polling the feed when the service was shut down.
             * Stop doing anything else, so we can exit cleanly, if necessary.
             */
            if (this.state.configuration.debug) {
                console.debug('Shutting down mid-stream feed polling.')
            }
            return;
        } else if (!data) {
            /*
             * Really? Nothing? Is anyone even running this feed anymore?
             */
            console.warn(`Received no data from feed '${this.feed.name}'`);
        } else {
            let promise: Promise<ReportJSON[]>;
            if (this.parser) {
                promise = this.parser.parse(data, this.feed, this.state);
            }
            (promise || Promise.resolve([]))
                .then((feedReports: any[]) => {
                    this.processReports(feedReports, reports);
                })
                .catch(() => {
                    // ignore the rejection, we already logged it
                });
        }
    }

    /**
     * 
     */
    private processReports(feedReports: ReportJSON[], reports: ReportJSON[]) {
        (feedReports || [])
            /*
             * Weed out all the reports we know about already.
             * 
             * TODO We may need something better than comparing just the name and source.
             */
            .filter((report) => ![...this.currentReports].some((current) => {
                return (current.name === report.stix.name) && (current.source === report.metaProperties.source);
            }))
            /*
             * Compare reports to the boards we were passed to see if any of them appear to be of possible interest to the board watchers
             * (high likelihood of false positive, but that's what we want[?]). If any match, save them.
             */
            .forEach((report) => {
                const matches = this.boards.reduce((matched: Document[], board) => {
                    if ((this.parser.match || this.findMatchingBoards)(report, board)) {
                        matched.push(board);
                    }
                    return matched;
                }, []);
                if (matches.length) {
                    report.stix.id = `report--${uuid.v4()}`;
                    matches.forEach((match) => {
                        const board: any = match;
                        if (this.state.configuration['fire-notifications'] === true) {
                            this.notifyBoard(match, report);
                        }
                        if (!board.metaProperties.potentials) {
                            board.metaProperties.potentials = [];
                        }
                        board.metaProperties.potentials.push(report.stix.id);
                    });
                    reports.push(report);
                }
            });
    }

    /**
     * Locate any boards that might be interested in the given report. This is a very basic search, trying to match up the threat board's start and
     * end dates with the report's publish date, and hoping to find a label in the report that matches one of the boards other boundaries.
     * 
     * TODO We will need something more sophisticated down the road.
     */
    private findMatchingBoards(report: any, board: any) {
        return ((board.stix.boundaries.start_date.getTime() <= report.stix.published) &&
                (!board.stix.boundaries.end_date || (board.stix.boundaries.end_date.getTime() >= report.stix.published)));
    };

    /**
     * Send a notification to users of the given threat board that the given report is a possible match.
     */
    private notifyBoard(board: any, report: ReportJSON) {
        const host = this.state.configuration['socket-server-host'];
        const port = this.state.configuration['socket-server-port'];
        const reference = `'${report.stix.name}' read from '${report.metaProperties.source}'`;
        const body = JSON.stringify({
            data: {
                attributes: {
                    userId: new ObjectId(0),
                    orgId: board.stix.created_by_ref,
                    notification: {
                        type: 'STIX',
                        heading: `Potential threat report match for ${board.stix.name}`,
                        body: `New report ${reference} may meet criteria for this threat board`,
                        link: `/threat-beta/board/${board._id}`,
                        stixId: null
                    },
                    emailData: null
                }
            }
        });
        fetch(`https://${host}:${port}/publish/notification/organization`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body
            })
            .then((response) => {
                if (response.status === 200) {
                    console.log(`Websocket received board notification for '${board.stix.created_by_ref}'`);
                } else {
                    console.warn(`Websocket rejected board notification for '${board.stix.created_by_ref}':`, response.status, response.statusText);
                }
            })
            .catch((err) => console.log('Error!', err));
    }

}
