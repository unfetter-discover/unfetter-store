#!/usr/bin/env node

import * as Yarg from 'yargs';
import { CtfIngest } from './ctf-ingest';
import { CtfToStixAdapter } from './ctf-to-stix-adapter';

// 'read csv ctf data, map to stix, ingest using unfetter api'
Yarg.usage('Usage: $0 -f [csvFile]')
    .demandOption(['f']);

const argv = Yarg.argv;
if (argv) {
    const fileName = argv.f;
    const ctfIngest = new CtfIngest();
    ctfIngest.ingestCsv(fileName);
}
