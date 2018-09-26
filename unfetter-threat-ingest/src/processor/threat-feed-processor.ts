import * as https from 'https';
import * as uuid from 'uuid';
import { Document } from 'mongoose';
import { DaemonState, StatusEnum } from '../models/server-state';
import ReportJSON from './report-json';

export default class ThreatFeedProcessor {

    constructor(
        private feed: any,
        private boards: Document[],
        private currentReports: any[],
        private state: DaemonState,
    ) {
    }

    public async poll() {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        const HTTPSOptions = {
            // requestCert: true,
            // rejectUnauthorized: false,
            // key: fs.readFileSync(`${state.configuration['cert-dir']}/${state.configuration['server-key']}`),
            // cert: fs.readFileSync(`${state.configuration['cert-dir']}/${state.configuration['server-cert']}`),
            // ca: fs.readFileSync('/Users/carltonanderson/Documents/VeriSignUniversalRootCertificationAuthority.crt'),
        };
        const options = (typeof this.feed.source === 'string') ? this.feed.source : {...this.feed.source};
        if (this.feed.source.protocol === 'https:') { // will be false if the source is just a string
            Object.assign(options, HTTPSOptions);
        }
        const reports: ReportJSON[] = [];
        await this.pollFeed(options)
            .then((data) => this.handlePollResolve(data, reports))
            .catch((reason) => {
                /*
                 * Something went wrong trying to contact the feed source.
                 * 
                 * TODO We should probably be keeping track of these, deactivating them if they keep giving us errors,
                 *      only retrying after many cybermoons to see if they've come back. Also send admins a notice,
                 *      they should know to keep an eye on this.
                 */
                console.warn(`Could not poll feed '${this.feed.name}':`, reason);
            });
        return reports;
    }

    /**
     * Fire the given request to a feed source.
     */
    private pollFeed(options: any) {
        return new Promise((resolve, reject) => {
            const request = https.get(options, (res) => {
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
            if (this.feed.parser && this.feed.parser.type) {
                const parser = this.state.processor.parsers.getParser(this.feed.parser.type);
                if (parser) {
                    promise = parser.parse(data, this.feed, this.state);
                }
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
             * Compare reports to the boards we were passed to see if any of them appear to be of possible
             * interest to the board watchers (high likelihood of false positive, but that's what we
             * want[?]). If any match, save them.
             */
            .forEach((report) => {
                const matches = this.findMatchingBoards(report, this.boards, this.state);
                if (matches && matches.length) {
                    report.stix.id = `report--${uuid.v4()}`;
                    matches.forEach((board: any) => board.stix.reports.push(report.stix.id));
                    reports.push(report);
                }
            });
    }

    /**
     * Locate any boards that might be interested in the given report. This is a very basic search, trying to match up
     * the threat board's start and end dates with the report's publish date, and hoping to find a label in the report
     * that matches one of the boards other boundaries.
     * 
     * TODO We will need something more sophisticated down the road.
     */
    private findMatchingBoards(report: any, boards: Document[], state: DaemonState) {
        const matches: Document[] = [];
        boards.forEach((board: any) => {
            if ((board.stix.boundaries.start_date <= report.stix.published) &&
                    (!board.stix.boundaries.end_date ||
                            (board.stix.boundaries.end_date >= report.stix.published))) {
                matches.push(board);
            }
        });
        return matches;
    };

}
