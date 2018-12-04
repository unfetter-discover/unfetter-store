import { ThreatFeedParser } from './threat-feed-parser';
import { DaemonState } from '../models/server-state';
import ReportJSON from './report-json';

export class ThreatFeedJSONParser extends ThreatFeedParser {

    constructor(_type: string) {
        super(_type || 'JSON');
    }

    public parse(data: string, feed: any, state: DaemonState): Promise<ReportJSON[]> {
        return new Promise((resolve, reject) => {
            try {
                const json = JSON.parse(data);
                /*
                 * Find the node that has our reports.
                 */
                const root = this.locateRoot(json, feed.parser.root);
                if (!root) {
                    /*
                     * Couldn't find the root node, alert the press.
                     */
                    if (state.configuration.debug) {
                        console.debug(`could not find root node ${feed.parser.root}`, data);
                        reject();
                    }
                } else {
                    const articles = this.locateArticles(root, feed.parser.articles);
                    if (!articles) {
                        /*
                         * Couldn't find the child report node(s), alert the military.
                         */
                        if (state.configuration.debug) {
                            console.debug(`could not find articles node ${feed.parser.articles}`, data);
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
                resolve(json);
            } catch (err) {
                console.warn(`Could not parse output from feed '${feed.name}': `, err, data);
                reject();
            }
        });
    }

    /**
     * If the feed is configured with a root node, try to find it. If we can't, we return null. This can be a slash-delimited (/) path (no leading or
     * trailing slash).
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
                articles = root[articleNodes];
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
        let value = this.getValueFromPath(convert.element, item);
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
    }

    /**
     * Split the given slash-delimited path, which may end with an @-separated attribute, and traverse the node to try and find the resulting element.
     */
    private getValueFromPath(nodepath: string, node: any) {
        if (node) {
            nodepath.split('/').forEach((path: string, index: number, splits: string[]) => {
                if (node) {
                    node = node[path];
                }
            });
        }
        return node;
    }

}

(() => new ThreatFeedJSONParser(null))();
