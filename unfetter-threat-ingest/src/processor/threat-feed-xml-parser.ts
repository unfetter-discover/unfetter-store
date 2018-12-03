import * as xml2js from 'xml2js';
import { ThreatFeedParser } from './threat-feed-parser';
import { DaemonState } from '../models/server-state';
import ReportJSON from './report-json';

const XMLParser = new xml2js.Parser();

export type Converter = (values: any[], isArray: boolean) => any;

export class ThreatFeedXMLParser extends ThreatFeedParser {

    protected converters: {[type: string]: Converter} = {

        'boolean': (values: any[], isArray: boolean) => {
            const vals = values.map((v) => ['true', 'yes', 'on', '1'].includes((v || '').toString().toLocaleLowerCase()));
            return isArray ? vals : vals.reduce((tf, v) => tf || v, false);
        },

        'integer': (values: any[], isArray: boolean) => {
            const vals = values.map((v) => Number.parseInt((v || '').toString()));
            return isArray ? vals : vals.filter((v) => (v !== null) && !Number.isNaN(v));
        },

        'float': (values: any[], isArray: boolean) => {
            const vals = values.map((v) => Number.parseFloat((v || '').toString()));
            return isArray ? vals : vals.filter((v) => (v !== null) && !Number.isNaN(v));
        },

        'date': (values: any[], isArray: boolean) => {
            const vals = values.map((v) => {
                let val = Date.parse((v || '').toString());
                if (Number.isNaN(val)) {
                    val = Number.parseInt((v || '').toString());
                }
                if (!Number.isNaN(val)) {
                    return new Date(val);
                }
                return null;
            });
            return isArray ? vals : vals.filter((v) => v !== null);
        },

    };

    constructor(_type: string) {
        super(_type || 'XML');
        this.converters['bool'] = this.converters['boolean'];
        this.converters['int'] = this.converters['integer'];
    }

    public parse(data: string, feed: any, state: DaemonState): Promise<ReportJSON[]> {
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
                    const root = this.locateRoot(json, feed.parser.root);
                    if (!root) {
                        /*
                         * Couldn't find the root node, alert the press.
                         */
                        if (state.configuration.debug) {
                            console.debug(`Feed '${feed.name}', could not find root node ${feed.parser.root}`, JSON.stringify(json));
                            reject();
                        }
                    } else {
                        const articles = this.locateArticles(root, feed.parser.articles);
                        if (!articles) {
                            /*
                             * Couldn't find the child report node(s), alert the military.
                             */
                            if (state.configuration.debug) {
                                console.debug(`Feed '${feed.name}', could not find articles node ${feed.parser.articles}`, JSON.stringify(root));
                            }
                        } else {
                            /*
                             * Yea!, we found some reports. Now try to convert them, and pass them to the callback.
                             */
                            const reports: ReportJSON[] = [];
                            articles.forEach((item: any) => {
                                const report = this.parseFeedReport(feed, item, state);
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
    }

    /**
     * If the feed is configured with a root node, try to find it. If we can't, we return null. This can be a slash-delimited (/) path
     * (no leading or trailing slash).
     */
    private locateRoot(json: any, rootPath: string) {
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
    }

    /**
     * If the feed is configured with the name of an element at the top of the root node that contains all our child nodes, try to find it.
     * If we can't, we return null.
     */
    private locateArticles(root: any, articleNodes: string) {
        let articles = root;
        if (articleNodes) {
            if (root[articleNodes]) {
                articles = [].concat(root[articleNodes]);
            } else {
                articles = null;
            }
        }
        return articles;
    }

    /**
     * Extract a STIX report from the given article. At the very least, we expect it to give us a name.
     */
    protected parseFeedReport(feed: any, article: any, state: DaemonState) {
        const report: ReportJSON = {
            stix: {
                id: null,
                name: this.convertReportNode(article, 'name', feed.parser.convert, state),
                description: this.convertReportNode(article, 'description', feed.parser.convert, state),
                labels: this.convertReportNode(article, 'labels', feed.parser.convert, state, true),
                published: this.convertReportNode(article, 'published', feed.parser.convert, state),
            },
            metaProperties: {
                source: feed.name
            }
        };
        Object.keys(feed.parser.convert.metaProperties).forEach((property) => {
            (report.metaProperties as any)[property] = this.convertReportNode(article, property, feed.parser.convert.metaProperties, state);
        });
        if (state.configuration.debug) {
            console.log(`Read '${feed.name}' feed item:`, report);
        }
        return report.stix.name ? report : undefined;
    }

    /**
     * Here's a fun part of the feed configuration. As you may have guessed by now, the feed information consists of a name, a source (which may be a
     * URL string or an entire request options object), and a parser object that contains a type ('xml' is the only value currently recognized), a
     * path to the root element, and the name of the articles element that contains the list of reports the feed returns.
     * 
     * The parser object also has a convert element that lists each STIX element on a report: name, description, labels, published, as well as a
     * metaProperties element that lists anything else on the feed we want to add to the report:
     * 
     * - If the property is missing from the feed.parser.convert object, then the property is searched by its name in the article, and it is expected
     *   that whatever datatype it is, that will be what is found. If missing, the value is set to undefined.
     * 
     * - If the property is a string, then the article node is searched for an element with that string name instead. Again, it is expected to return
     *   whatever datatype you expect of it, without conversion. If missing the value is set to undefined. Like the root path, this string can also
     *   be a path, to a deeply nested node, and can also point to an attribute (such as "div/a@href"). At this time, we cannot handle arrays in the
     *   path (although a path that yields an array is perfectly fine).
     * 
     * - The property can also be an object that contains at least an "element" property. The element property is used just like if the property were
     *   a string, so again it can be a path to your nested report value. There are two other properties supported at this time: "arity" and "type".
     *   The type property allows you to perform a simple conversion from a string to boolean, integer, float or Date objects. We have no other
     *   converters at this time, but will need to add a means of plugging new converters in at runtime. The arity property simply tells us the
     *   element is an array, even if we do not receive an array for the element (we only retrieved a single item).
     */
    protected convertReportNode(item: any, node: string, converts: any, state: DaemonState, isArray: boolean = false) {
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
            const val = this.getValueFromPath(convert, item) || undefined;
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
        let values = [].concat(this.getValueFromPath(convert.element, item));
        let value = values;
        if (values && convert.type) {
            const type = convert.type.toLocaleLowerCase();
            if (this.converters[type]) {
                value = this.converters[type](values, isArray);
            }
        }
        return (value && value.length && !isArray) ? value[0] : value;
    }

    /**
     * Split the given slash-delimited path, which may end with an @-separated attribute, and traverse the node to try and find the resulting element.
     */
    private getValueFromPath(nodepath: string, node: any) {
        if (node) {
            nodepath.split('/').forEach((path: string, index: number, splits: string[]) => {
                const [step, splitType, attribute, equals, value] = path.split(/([.@=])/, 5);
                node = (node && step) ? node[step] : node;
                const isLast = index === splits.length - 1;
                const isClass = splitType === '.';
                if (Array.isArray(node)) {
                    node = node.map((n) => this.matchNode(n, step, attribute, value, isLast, isClass))
                        .filter((n) => (n !== null) && (n !== undefined));
                } else {
                    node = this.matchNode(node, step, attribute, value, isLast, isClass);
                }
            });
        }
        return node;
    }

    private matchNode(node: any, step: string, attribute: string, value: string, isLast: boolean, isClass: boolean) {
        if (isClass) {
            value = attribute;
            attribute = 'class';
        }
        if (node && attribute && node.attributes && node.attributes[attribute]) {
            if ((value !== undefined) && (value !== null)) {
                node = (node.attributes[attribute] === value) ? node['_'] : null;
            } else if (isLast) {
                node = node.attributes[attribute];
            }
        }
        return node;
    }

}

(() => new ThreatFeedXMLParser(null))();
