import * as fs from 'fs';
import * as https from 'https';
import * as xml2js from 'xml2js';
import * as yargs from 'yargs';
import * as uuid from 'uuid';

import { Document } from 'mongoose';
import * as modelFactory from '../models/modelFactory';
const ReportModel = modelFactory.getModel('reports');
const ThreatBoardModel = modelFactory.getModel('threat-boards');

import { DaemonState, StatusEnum, PromisedService } from '../models/server-state';

export type ProcessorService = PromisedService<any>;

const XMLParser = new xml2js.Parser();

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
        console.debug('Pulling threat board criteria')
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
                 * No threat boards in the database. Maybe you should add one, either injecting into Mongo or using the
                 * UI. After doing so, you can wait for the next polling interval, or call endpoint /resync/boards.
                 * Again, if using the UI, the UI should follow up with a call to that endpoint.
                 */
                console.warn('No threat board data found');
            } else {
                const reports = currentReports.map((report: any) => {
                    return {name: report.stix.name, source: report['_doc']['metaProperties']['_doc']['source']};
                });
                console.log('mapped reports:', reports);

                /*
                 * Split the returned boards into ones that are brand new, and those we have polled for before.
                 * 
                 * This is currently blocked; all boards are queried at once. That is because we have no real way to
                 * ask many feeds for historical data...
                 */
                // const newBoards = boards.filter((board: any) => !board.metaProperties.lastPolled);
                // const polledBoards = boards.filter((board: any) => board.metaProperties.lastPolled !== undefined);
                // if (newBoards.length) {
                //     pollReports(newBoards, currentReports, state);
                // }
                // if (polledBoards.length) {
                //     pollReports(polledBoards, currentReports, state);
                // }
                const polls = state.configuration.feedSources.map((feed: any) => {
                    return pollReports(feed, boards, reports, state);
                });
                (async () => {
                    await Promise.all(polls)
                        .then(() => console.log('All feed polls have completed.'))
                        .catch((err) => console.log('Error finishing feed pools:', err))
                        .finally(() => {
                            /*
                             * After all that, update each board to show they were recently polled for.
                             */
                            // boards.forEach((board) => {
                            //     (board as any).metaProperties.lastPolled = Date.now();
                            //     console.debug('Updating board:', board);
                            //     board.save((err, tb) => {
                            //         if (err) {
                            //             console.warn(`Could not update threat board '${(board as any).stix.name}':`, err);
                            //         }
                            //     });
                            // });
                            // if (state.configuration.debug) {
                            //     console.debug('Updated last poll time on boards', boards.map((board: any) => board.stix.name));
                            // }
                        });
                })();
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

/**
 * Query a feeds for the given board criteria.
 */
const pollReports = async (feed: any, boards: Document[], currentReports: any[], state: DaemonState) => {
    const httpsOptions = getSecureQueryOptions(state);
    const options = (typeof feed.source === 'string') ? feed.source : {...feed.source};
    if (feed.source.protocol === 'https:') { // will be false if the source is just a string
        Object.assign(options, httpsOptions);
    }
    await pollFeed(options)
        .then((data) => {
            if (state.processor.status.getValue() !== StatusEnum.RUNNING) {
                /*
                 * If this block gets executed, it is because we were polling the feed when the service was shut down.
                 * Stop doing anything else, so we can exit cleanly, if necessary.
                 */
                if (state.configuration.debug) {
                    console.debug('Shutting down mid-stream feed polling.')
                }
                return;
            } else if (!data) {
                /*
                 * Really? Nothing? Is anyone even running this feed anymore?
                 */
                console.warn(`Received no data from feed '${feed.name}'`);
            } else {
                handleResponse(feed, data, currentReports, boards, state);
            }
        })
        .catch((reason) => {
            /*
             * Something went wrong trying to contact the feed source.
             * 
             * TODO We should probably be keeping track of these, deactivating them if they keep giving us errors,
             *      only retrying after many cybermoons to see if they've come back. Also send admins a notice,
             *      they should know to keep an eye on this.
             */
            console.warn(`Could not poll feed '${feed.name}':`, reason);
        });
};

/**
 * For HTTPS requests, we should add certificates. Unfortunately all we have are server certs... Also unfortunate that
 * for non-production modes, all we have a self-signed certs, which are automatically rejected... For now, we seem to
 * be okay without any of these settings (crossfingers emoji here).
 */
const getSecureQueryOptions = (state: DaemonState) => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const HTTPSOptions = {
        // requestCert: true,
        // rejectUnauthorized: false,
        // key: fs.readFileSync(`${state.configuration['cert-dir']}/${state.configuration['server-key']}`),
        // cert: fs.readFileSync(`${state.configuration['cert-dir']}/${state.configuration['server-cert']}`),
        // ca: fs.readFileSync('/Users/carltonanderson/Documents/VeriSignUniversalRootCertificationAuthority.crt'),
    };
    return HTTPSOptions;
}

/**
 * Fire the given request to a feed source.
 */
const pollFeed = (options: any) => {
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
 * Fire the request to parse the given XML into JSON and wait.
 */
const handleResponse = async (feed: any, data: any, currentReports: any[], boards: Document[], state: DaemonState) => {
    let promise: Promise<{}>;

    /*
     * TODO need more dynamic parsing modules. After all, every feed is different. This implementation counts on the
     *      data being XML (hey, it -is- RSS), and that everything parses "easily" into a STIX report object.
     */
    if (feed.parser && /xml/i.test(feed.parser.type)) {
        promise = parseXMLReports(feed, data, state);
    }

    await (promise || Promise.resolve([]))
        .then((reports: any[]) => {
            (reports || [])
                /*
                 * Weed out all the reports we know about already.
                 * 
                 * TODO We need something better than comparing just the name
                 */
                .filter((report) => ![...currentReports].some((current) => {
                    return (current.name === report.stix.name)
                            && (current.source === report.metaProperties.source);
                }))
                /*
                 * Compare reports to the boards we were passed to see if any of them appear to be of possible
                 * interest to the board watchers (high likelihood of false positive, but that's what we
                 * want[?]). If any match, save them.
                 */
                .forEach((report) => {
                    const matches = findMatchingBoards(report, boards, state);
                    if (matches && matches.length) {
                        saveReport(report, matches);
                        if (state.configuration.debug) {
                            console.debug('Persisted new report', report, 'for boards',
                                    matches.map((board: any) => board.stix.name));
                        }
                    }
                });
        })
        .catch(() => {
            // ignore the rejection, we already logged it
        });
}

/**
 * Parse the output reports from the given feed formatted as XML, into STIX report objects.
 */
const parseXMLReports = (feed: any, data: string, state: DaemonState) => {
    return new Promise((resolve, reject) => {
        xml2js.parseString(data, {
            trim: true,             // trim all strings (but not -all- embedded whitespace`)
            explicitArray: false,   // don't automatically convert all node values to arrays, it's bloody annoying
            attrkey: 'attributes',  // use explicit node name for attributes, rather than cryptic '$'
        }, (err, json) => {
            if (err) {
                /*
                 * Well this is bad, the result was not XML. Again, we should be managing "bad" feeds, but moving on...
                 */
                console.warn(`Could not parse output from feed '${feed.name}': `, err, data);
                reject();
            } else if (!json) {
                /*
                 * That's... odd. You sure you had nothing to say?...
                 */
                console.warn(`Somehow parsed an empty response from feed '${feed.name}'`);
                reject();
            } else {
                /*
                 * Find the node that has our reports.
                 */
                const root = locateRoot(json, feed.parser.root);
                if (!root) {
                    /*
                     * Couldn't find the root node, alert the press.
                     */
                    if (state.configuration.debug) {
                        console.debug(`could not find root node ${feed.parser.root}`, JSON.stringify(json));
                        reject();
                    }
                } else {
                    const articles = locateArticles(root, feed.parser.articles);
                    if (!articles) {
                        /*
                         * Couldn't find the child report node(s), alert the military.
                         */
                        if (state.configuration.debug) {
                            console.debug(`could not find articles node ${feed.parser.articles}`, JSON.stringify(root));
                        }
                    } else {
                        /*
                         * Yea!, we found some reports. Now try to convert them, and pass them to the callback.
                         */
                        const reports: any[] = [];
                        articles.forEach((item: any) => {
                            const report = parseFeedReport(feed, item, state);
                            if (report !== undefined) {
                                reports.push(report);
                            }
                        });
                        resolve(reports);
                    }
                }
            }
        });
    });
};

/**
 * If the feed is configured with a root node, try to find it. If we can't, we return null. This can be a slash (/)
 * delimited path (no leading or trailing slash).
 */
const locateRoot = (json: any, rootPath: string) => {
    let root = json;
    if (rootPath) {
        rootPath.split('/').forEach((node: string) => {
            if (root && root[node]) {
                root = root[node];
            } else {
                root = null;
            }
        });
    }
    return root;
};

/**
 * If the feed is configured with the name of an element at the top of the root node that contains all our child nodes,
 * try to find it. If we can't, we return null.
 */
const locateArticles = (root: any, articleNodes: string) => {
    let articles = root;
    if (articleNodes) {
        if (root[articleNodes]) {
            articles = root[articleNodes];
        } else {
            articles = null;
        }
    }
    return articles;
};

/**
 * Extract a STIX report from the given article. At the very least, we expect it to give us a name.
 */
const parseFeedReport = (feed: any, article: any, state: DaemonState) => {
    const report = {
        stix: {
            name: convertReportNode(article, 'name', feed.parser.convert, state),
            description: convertReportNode(article, 'description', feed.parser.convert, state),
            labels: convertReportNode(article, 'labels', feed.parser.convert, state, true),
            published: convertReportNode(article, 'published', feed.parser.convert, state),
        },
        metaProperties: {
            source: feed.name
        }
    };
    Object.keys(feed.parser.convert.metaProperties).forEach((property) => {
        (report.metaProperties as any)[property] =
                convertReportNode(article, property, feed.parser.convert.metaProperties, state);
    });
    if (state.configuration.debug) {
        console.log('feed item', report);
    }
    return report.stix.name ? report : undefined;
};

/**
 * Here's a fun part of the feed configuration. As you may have guessed by now, the feed information consists of a name,
 * a source (which may be a URL string or an entire request options object), and a parser object that contains a type
 * ('xml' is the only value currently recognized), a path to the root element, and the name of the articles element
 * that contains the list of reports the feed returns.
 * 
 * The parser object also has a convert element that lists each STIX element on a report: name, description, labels,
 * published, as well as a metaProperties element that lists anything else on the feed we want to add to the report:
 * 
 * - If the property is missing from the feed.parser.convert object, then the property is searched by its name in the
 *   article, and it is expected that whatever datatype it is, that will be what is found. If missing, the value is set
 *   to undefined.
 * 
 * - If the property is a string, then the article node is searched for an element with that string name instead. Again,
 *   it is expected to return whatever datatype you expect of it, without conversion. If missing the value is set to
 *   undefined. Like the root path, this string can also be a path, to a deeply nested node, if necessary, and can
 *   also point to an attribute (such as "div/a@href"). At this time, we cannot handle arrays in the path (although a
 *   path that yields an array is perfectly fine).
 * 
 * - The property can also be an object that contains at least an "element" property. The element property is used just
 *   like if the property were a string, so again it can be a path to your nested report value. There are two other
 *   properties supported at this time: "arity" and "type". The type property allows you to perform a simple conversion
 *   from a string to boolean, integer, float or Date objects. We have no other converters at this time, but will need
 *   to add a means of plugging new converters in at runtime. The arity property simply tells us the element is an
 *   array, even if we do not receive an array for the element (we only retrieved a single item).
 */
const convertReportNode = (item: any, node: string, converts: any, state: DaemonState, isArray: boolean = false) => {
    /*
     * Determine if this node is expected to be an array.
     */
    isArray = isArray || (converts && converts[node] && (converts[node].arity === true));

    /*
     * If we have no converter for this element, just search on its name.
     */
    if (!converts || !converts[node]) {
        const val = item[node] || undefined;
        return (val && isArray && !Array.isArray(val)) ? [val] : val;
    }

    const convert = converts[node];

    /*
     * If the converter is just a string, then it is a path to the element.
     */
    if (typeof convert === 'string') {
        const val = getValueFromPath(convert, item) || undefined;
        return (val && isArray && !Array.isArray(val)) ? [val] : val;
    }

    /*
     * If it's not a string, then it has to be an object with an element property.
     */
    if (!convert || !convert.element) {
        if (state.configuration.debug) {
            console.warn(`Don't know how to convert '${node}', invalid converter information:`, convert, converts);
        }
        return undefined;
    }

    /*
     * Retrieve the value at the element path, convert if necessary.
     */
    let value = getValueFromPath(convert.element, item);
    if (value && convert.type) {
        switch ((convert.type as string).toLocaleLowerCase()) {
            case 'bool':
            case 'boolean':
                value = ['true', 'yes', 'on', '1'].includes(value.toString().toLocaleLowerCase());
                break;
            case 'int':
            case 'integer':
                value = Number.parseInt(value.toString());
                break;
            case 'float':
                value = Number.parseFloat(value.toString());
                break;
            case 'date':
                value = Date.parse(value.toString());
                break;
        }
    }
    return (value && isArray && !Array.isArray(value)) ? [value] : value;
};

/**
 * Split the given slash-delimited path, which may end with an @-separated attribute, and traverse the node to try and
 * find the resulting element.
 */
const getValueFromPath = (nodepath: string, node: any) => {
    nodepath.split('/').forEach((path: string, index: number, splits: string[]) => {
        const [step, attribute] = path.split('@', 2);
        if (node && node[step]) {
            node = node[step];
            if ((index === splits.length - 1) && attribute) {
                if (node.attributes && node.attributes[attribute]) {
                    node = node.attributes[attribute];
                } else {
                    node = null;
                }
            }
        } else {
            node = null;
        }
    });
    return node;
};

/**
 * Locate any boards that might be interested in the given report. This is a very basic search, trying to match up the
 * threat board's start and end dates with the report's publish date, and hoping to find a label in the report that
 * matches one of the boards other boundaries.
 * 
 * TODO We will need something more sophisticated down the road.
 */
const findMatchingBoards = (report: any, boards: Document[], state: DaemonState) => {
    const matches: Document[] = [];
    boards.forEach((board: any) => {
        if ((board.stix.boundaries.start_date <= report.stix.published) &&
                (!board.stix.boundaries.end_date || (board.stix.boundaries.end_date >= report.stix.published)) &&
                ((!board.stix.boundaries.intrusion_sets ||
                        report.stix.labels.some((label: string) => board.stix.boundaries.intrusion_sets.includes(label))) ||
                (!board.stix.boundaries.malware ||
                        report.stix.labels.some((label: string) => board.stix.boundaries.malware.includes(label))) ||
                (!board.stix.boundaries.targets ||
                        report.stix.labels.some((label: string) => board.stix.boundaries.targets.includes(label))))) {
            matches.push(board);
        }
    });
    return matches;
};

/**
 * We like this report. We want to keep this report.
 * 
 * TODO we need to fire a notification using the socket server after the report is added to each board.
 */
const saveReport = async (report: any, matchingBoards: Document[]) => {
    report._id = report.stix.id = `report--${uuid.v4()}`;
    const persist = new ReportModel(report);
    await new Promise(
        (resolve, reject) => {
            persist.save((err, doc: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        })
        .then(() => matchingBoards.forEach((board) => updateBoard(board, report)))
        .catch((err) => console.error('Could not save report:', err));
};

const updateBoard = async (board: any, report: any) => {
    console.log(`i want to update '${board.stix.name}'`, board);
    board.stix.reports.push(report._id);
    // await new Promise(
    //     (resolve, reject) => {
    //         board.save((err, doc) => {
    //             if (err) {
    //                 reject(err);
    //             } else {
    //                 resolve();
    //             }
    //         })
    //     })
    //     .then(() => {
    //         // @TODO send notification to each "user" of the board (using socket server)
    //     })
    //     .catch((err) => {
    //         console.error('Could not update board:', err);
    //     });
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

            state.processor.refresh = poll;
            state.processor.status.next(StatusEnum.RUNNING);

            setTimeout(() => poll(state), 100);

            process.on('SIGINT', () => onShutdown(state));
            process.on('SIGTERM', () => onShutdown(state));

            resolve(new PromisedService('Processor initialized', {}));
        }
    });
}
