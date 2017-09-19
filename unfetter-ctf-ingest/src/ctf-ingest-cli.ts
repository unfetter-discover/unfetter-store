#!/usr/bin/env node

import * as Yarg from 'yargs';
import { CtfIngest } from './ctf-ingest';
import { CtfToStixAdapter } from './ctf-to-stix-adapter';
import { Environment } from './environment';

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
    .alias('f', 'file')
    .describe('f', 'file name of the csv file to ingest')
    .demandOption(['f']);

const argv = Yarg.argv;
if (argv) {
    Environment.apiHost = argv['host'];
    Environment.apiPort = argv['port'];
    Environment.context = argv['context'];
    const fileName = argv['file'];
    const ctfIngest = new CtfIngest();
    ctfIngest.ingestCsv(fileName);
}
