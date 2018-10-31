import { } from 'jasmine';
import { ThreatFeedXMLParser } from './threat-feed-xml-parser';
import { DaemonState } from '../models/server-state';

describe('xml parser', () => {

    const mockFeed = {
        name: 'Mock Feed',
        parser : {
            root : 'rss',
            articles : 'entry',
            convert : {
                name : 'title',
                description: {
                    element: 'summary/div.text'
                },
                labels : {
                    element : 'category@name=label',
                    arity: true,
                },
                published : {
                    element : 'pubDate',
                    type : 'date'
                },
                metaProperties : {
                    link : 'link',
                    image : 'enclosure@url',
                    classification: 'summary/div.classification'
                }
            }
        }
    };
    const mockState = {
        configuration: {
            debug: false,
        }
    } as DaemonState;

    it('should find matching nodes', () => {
        const parser = new ThreatFeedXMLParser(null);
        const mockData = `
            <rss>
                <title>Feed Title</title>
                <entry>
                    <title>Entry #1</title>
                    <summary>
                        <div class="classification">super secret</div>
                        <div class="text">An entry description</div>
                    </summary>
                    <category name="subject">Bad Guys</category>
                    <category name="label">threat</category>
                    <category name="label">terrorism</category>
                    <category name="subject">Terrorist Activity</category>
                    <pubDate>2018-09-01T00:00:05Z</pubDate>
                    <link>http://google.com</link>
                    <enclosure url="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5e6FpWQZPI0jSyzDo6LQooaCmhfv69KGIE0O2jYtYoKcohgXSMQ"/>
                </entry>
                <entry>
                    <title>Entry #2</title>
                    <summary>
                        <div class="classification">not so secret</div>
                        <div class="text">Another entry description</div>
                    </summary>
                    <category name="label">victim</category>
                    <category name="subject">Virus Target</category>
                    <category name="subject">Cyber-Attack</category>
                    <category name="label">cyber</category>
                    <pubDate>1535760005000</pubDate>
                    <link>http://github.com</link>
                    <enclosure url="https://og.github.com/mark/github-mark@1200x630.png"/>
                </entry>
            </rss>
        `;
        const parsed = parser.parse(mockData, mockFeed, mockState)
            .then((reports) => {
                reports.forEach((report) => {
                    expect(report.stix).toBeDefined();
                    expect(report.stix.id).toBeNull();
                    expect(report.stix.name).toMatch(/Entry #[12]/);
                    expect(report.stix.description).toMatch(/An.* entry description/);
                    expect(report.stix.labels.length).toEqual(2);
                    expect(report.stix.published).toEqual(jasmine.any(Date));
                    expect((report.stix.published as Date).getTime()).toEqual(1535760005000);
                    expect(report.metaProperties).toBeDefined();
                    expect(report.metaProperties.source).toEqual('Mock Feed');
                    expect(report.metaProperties.link).toMatch(/http:\/\/.*/);
                    expect(report.metaProperties.image).toMatch(/https:\/\/.*/);
                    expect(report.metaProperties.classification).toMatch(/.* secret/);
                });
            })
            .catch((reason) => {
                expect(false).toBeTruthy(`parsing failed: ${reason}`);
            });
    });

});
