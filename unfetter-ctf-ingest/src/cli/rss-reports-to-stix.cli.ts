#!/usr/bin/env node

import * as fs from 'fs';
import * as Yarg from 'yargs';
import { StixBundle } from '../models/stix-bundle';
import { RssReportsFetchService } from '../services/ingest/rss-reports-fetch.service';

export class RssReportsToStixCli {
    public genOutFile(rssUrl: string, outFile: string): Promise<StixBundle | void> {
        if (outFile && fs.existsSync(outFile)) {
            console.log(outFile + ' already exists! Please delete and try again');
            process.exit(1);
        }

        const fetch = new RssReportsFetchService();
        return fetch.fetchLatest(rssUrl)
            .then((resp) => {
                const bundle = new StixBundle();
                // TODO: transform to stix 2.0
                bundle.objects = resp;
                fs.writeFileSync(outFile, bundle.toJson());
                console.log('generated bundle', outFile);
                return bundle;
            })
            .then(() => {
                process.exit(0);
            })
            .catch((err) => console.log(err));
    }
}

// 'read rss data, map to stix reports, output a stixbundle containing reports'
Yarg.usage('Usage: $0 -i localhost -o stixBundleFileName')
    .alias('i', 'input')
    .describe('i', 'RSS URL')
    .default('i', process.env.RSS_URL || 'https://www.us-cert.gov/ncas/alerts.xml')
    .alias('o', 'outfile')
    .describe('o', 'file name to output')
    .default('o', process.env.REPORTS_FILE || 'reports.stix.json')
    .alias('f', 'file')
    .demandOption(['i', 'o']);

const argv = Yarg.argv;
if (argv) {
    const rssUrl = argv['input'];
    const outFile = argv['outfile'] || undefined;
    console.log(rssUrl, outFile);
    const cli = new RssReportsToStixCli();
    cli.genOutFile(rssUrl, outFile);
}
