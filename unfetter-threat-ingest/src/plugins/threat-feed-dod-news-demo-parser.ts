import { DaemonState } from '../models/server-state';
import ReportJSON from '../processor/report-json';
import { ThreatFeedXMLParser } from '../processor/threat-feed-xml-parser';

/**
 * This is a demo of using the plugins module to inject new parsers into the ingest service. This parser is just a
 * default XML parser, but adds a matcher to compare the threat board's boundary values against any labels we read.
 */
class ThreatFeedDodNewsParser extends ThreatFeedXMLParser {

    constructor() {
        super('DoD-News-Demo');
    }

    /**
     * Overrides the configuration for one we know matches the DoD News RSS Feed.
     */
    public parse(data: string, feed: any, state: DaemonState): Promise<ReportJSON[]> {
        return super.parse(data, {
            ...feed,
            'parser' : {
                'root' : 'rss/channel',
                'articles' : 'item',
                'convert' : {
                    'name' : 'title',
                    'labels' : 'category',
                    'published' : {
                        'element' : 'pubDate',
                        'type' : 'date'
                    },
                    'metaProperties' : {
                        'link' : 'link',
                        'image' : 'enclosure@url'
                    }
                }
            }
        }, state);
    }

    /**
     * See class comment.
     */
    public match = (report: ReportJSON, board: any): boolean => {
        return ((board.stix.boundaries.start_date <= report.stix.published) &&
                (!board.stix.boundaries.end_date || (board.stix.boundaries.end_date >= report.stix.published)) &&
                (board.stix.boundaries.targets.some((target: any) => this.isInReport(report, target)) ||
                    board.stix.boundaries.malware.some((malware: any) => this.isInReport(report, malware)) ||
                    board.stix.boundaries.intrusion_sets.some((intrusion: any) => this.isInReport(report, intrusion))));
    };

    private isInReport = (report: ReportJSON, entry: any) => {
        console.debug('comparing', entry.stix.name, 'to', report.stix.labels);
        return report.stix.labels.includes(entry.stix.name);
    }

}

(() => new ThreatFeedDodNewsParser())();
