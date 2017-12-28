#!/usr/bin/env node

import * as Yarg from 'yargs';
import { Environment } from '../environment';
import { CtfIngestService } from '../services/ingest/ctf-ingest.service';
import { MongoConnectionService } from '../services/mongo-connection.service';

// 'read csv ctf data, map to stix, ingest using unfetter api'
Yarg.usage('Usage: $0 -h localhost -f [csvFile]')
    .alias('h', 'host')
    .describe('h', 'Host name and/or IP address for the API')
    .default('h', process.env.API_HOST || 'localhost')
    .alias('p', 'port')
    .describe('p', 'port for API')
    .default('p', process.env.API_PORT || '443')
    .alias('c', 'context')
    .describe('c', 'context root for the API')
    .default('c', process.env.API_CONTEXT || '/api/')
    .alias('pr', 'protocol')
    .describe('pr', 'protocol for the API')
    .default('pr', process.env.API_PROTOCOL || 'https')
    .alias('o', 'outfile')
    .describe('o', 'file name to output vs saving to the db')
    .alias('f', 'file')
    .describe('f', 'file name of the csv file to ingest')
    .default('o', process.env.REPORTS_FILE || 'reports.stix.json')
    .demandOption(['f']);

const argv = Yarg.argv;
if (argv) {
    Environment.apiProtocol = argv['protocol'];
    Environment.apiHost = argv['host'];
    Environment.apiPort = argv['port'];
    Environment.context = argv['context'];
    const fileName = argv['file'];
    const outFileName = argv['outfile'] || undefined;
    const ctfIngest = new CtfIngestService();
    ctfIngest.ingestCsv(fileName, outFileName).then(() => {
        console.log('closing connection');
        MongoConnectionService.closeConnection();
    }).catch((err) => {
        console.log(err);
    });
}
