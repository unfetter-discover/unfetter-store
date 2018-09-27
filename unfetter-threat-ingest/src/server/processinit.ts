import * as fs from 'fs';
import * as https from 'https';
import * as yargs from 'yargs';
import * as uuid from 'uuid';

import { Document } from 'mongoose';
import * as modelFactory from '../models/model-factory';
const ReportModel = modelFactory.getModel('reports');
const ThreatBoardModel = modelFactory.getModel('threat-boards');

import { DaemonState, StatusEnum, PromisedService, ProcessorService } from '../models/server-state';
import { ThreatFeedParsers } from '../processor/threat-feed-parser';
import ThreatFeedProcessor from '../processor/threat-feed-processor';

/**
 * Main entry point for polling feed sources for threat reports.
 */
const poll = (state: DaemonState) => {
    /*
     * If there are no feed sources configured, bail on this loop. If you see this problem, update the database with
     * feed sources, then either wait for the configuration to be reloaded, or call endpoint /resync/config. If the
     * UI allows us to add new sources, then the UI should follow up with a call to that endpoint.
     */
    if (!state.configuration.feedSources || !state.configuration.feedSources.length) {
        console.warn('No threat feed sources configured. Please update database information.')
        state.processor.pollTimer = setTimeout(() => poll(state),
                state.configuration['poll-interval'] * 60 * 1000);
        return;
    }

    if (state.configuration.debug) {
        console.debug('Pulling threat board criteria');
    }

    /*
     * Query for current reports and threat boards.
     */
    const promises = [];
    promises.push(ReportModel.find({'stix.type': 'report'}).exec());
    promises.push(ThreatBoardModel.find({'stix.type': 'x-unfetter-threat-board'}).exec());
    Promise.all(promises)
        .then(([currentReports, boards]) => {
            if (state.processor.status.getValue() !== StatusEnum.RUNNING) {
                /*
                 * If this block gets executed, it is because we were querying the database when the service was shut
                 * down. Stop doing anything else, so we can exit cleanly, if necessary.
                 */
                if (state.configuration.debug) {
                    console.debug('Shutting down mid-stream polling.')
                }
                return;
            } else if (!boards) {
                /*
                 * No threat boards in the database. Maybe you should add one, either injecting into Mongo or
                 * using the UI. After doing so, you can wait for the next polling interval, or call endpoint
                 * /resync/boards. Again, if using the UI, the UI should follow up with a call to that endpoint.
                 */
                console.warn('No threat board data found');
            } else {
                const reports = currentReports.map((report: any) => {
                    return {name: report.stix.name, source: report['_doc']['metaProperties']['_doc']['source']};
                });
                const polls = state.configuration.feedSources.map((feed: any) => {
                    if (state.configuration.debug) {
                        console.debug('Creating processor for feed', feed);
                    }
                    return new ThreatFeedProcessor(feed, boards, reports, state).poll();
                });
                Promise.all(polls)
                    .then((polledReports) => afterPolling([].concat(...polledReports), boards, state))
                    .catch((err) => console.log('Error finishing feed polls:', err));
            }
        })
        .catch((err) => console.log('Encountered an error querying the database:', err))
        .finally(() => {
            /*
             * Create a time to run the poll again after a configured number of minutes.
             */
            state.processor.pollTimer = setTimeout(() => poll(state),
                    state.configuration['poll-interval'] * 60 * 1000);

        });
};

const afterPolling = (polledReports: any[], boards: Document[], state: DaemonState) => {
    console.log('All feed polls have completed.');
    const saves = polledReports.map((report) => {
        const persist = new ReportModel({...report, _id: report.stix.id});
        return new Promise((resolve, reject) => {
            persist.save((err, doc: any) => {
                if (err) {
                    reject(err);
                } else {
                    if (state.configuration.debug) {
                        console.debug('Persisted new report', report);
                    }
                    resolve(true);
                }
            });
        });
    });
    Promise.all(saves)
        .then(() => {
            /*
             * After all that, update each board to show they were recently polled for.
             */
            boards.forEach((board) => {
                (board as any).metaProperties.lastPolled = Date.now();
                board.save((err, tb) => {
                    if (err) {
                        console.warn(`Could not update threat board '${(board as any).stix.name}':`, err);
                    } else {
                        if (state.configuration.debug) {
                            console.debug('Updated board', tb);
                        }
                    }
                });

                // @TODO send notification to each "user" of the board (using socket server)
            });
        })
}

/**
 * When requested, put a stop to all feed polling, and shut the processor down.
 */
const onShutdown = (state: DaemonState) => {
    state.processor.status.next(StatusEnum.STOPPING);
    if (state.processor.pollTimer) {
        clearTimeout(state.processor.pollTimer);
        state.processor.pollTimer = undefined;
    }
    state.processor.status.next(StatusEnum.SHUTDOWN);
};

/**
 * Start the service up, and prep the first firing of the feed polling.
 */
export default function initializeProcessor(state: DaemonState, options: yargs.Arguments): Promise<ProcessorService> {
    return new Promise((resolve, reject) => {
        if (state.processor.status.getValue() === StatusEnum.UNINITIALIZED) {
            state.processor.status.next(StatusEnum.INITIALIZING);

            state.processor.parsers = new ThreatFeedParsers();
            console.log('parsers:', state.processor.parsers['parsers']);

            state.processor.refresh = poll;
            state.processor.status.next(StatusEnum.RUNNING);

            setTimeout(() => poll(state), 100);

            process.on('SIGINT', () => onShutdown(state));
            process.on('SIGTERM', () => onShutdown(state));

            resolve(new PromisedService('Processor initialized', {}));
        }
    });
}
