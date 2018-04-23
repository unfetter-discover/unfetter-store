import * as yargs from 'yargs';

yargs.alias('h', 'host')
    .describe('h', 'Host name and/or IP address for MongoDB')
    .default('h', process.env.MONGO_HOST || 'localhost')

    .alias('d', 'database')
    .describe('d', 'Database for MongoDB')
    .default('d', process.env.MONGO_DB || 'stix')

    .alias('p', 'port')
    .describe('p', 'Port for MongoDB')
    .default('p', process.env.MONGO_PORT || 27017)

    .alias('s', 'stix')
    .describe('s', 'File paths for STIX bundles (0 to n)')
    .array('s')

    .alias('e', 'enhanced-stix-properties')
    .describe('e', 'File paths for enhanced STIX properties bundles (0 to n).  Must map to a an existing STIX id')
    .array('e')

    .alias('c', 'config')
    .describe('c', 'File paths for configuration files (0 to n)')
    .array('c')

    .alias('m', 'mitre-attack-data')
    .describe('m', 'Option to upload STIX data from Mitre ATT&CK\'s github')
    .choices('m', ['enterprise', 'pre', 'mobile'])
    .array('m')

    .alias('a', 'auto-publish')
    .describe('a', 'Auto publish STIX to all organizations')
    .boolean('a')
    .default('a', process.env.AUTO_PUBLISH || true)

    .help('help');

const argv = yargs.argv;

export default argv;
