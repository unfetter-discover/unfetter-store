#!/usr/bin/env node
"use strict";
exports.__esModule = true;
var Yarg = require("yargs");
var ctf_ingest_1 = require("./ctf-ingest");
// 'read csv ctf data, map to stix, ingest using unfetter api'
Yarg.usage('Usage: $0 -f [csvFile]')
    .demandOption(['f']);
var argv = Yarg.argv;
if (argv) {
    var fileName = argv.f;
    var ctfIngest = new ctf_ingest_1.CtfIngest();
    ctfIngest.csvToStix(fileName);
}
