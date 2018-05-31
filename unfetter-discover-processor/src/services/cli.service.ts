import * as yargs from 'yargs';

import Interval from '../models/interval.enum';
import stringEnumToArray from '../adapters/string-enum-to-array.adapter';

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

    .alias('i', 'interval')
    .describe('i', 'Continuously run processor at a given interval')
    .choices('i', stringEnumToArray(Interval).map((interval) => interval.toLowerCase()))

    // ~~~ Pattern Handling ~~~

    .alias('q', 'pattern-handler-domain')
    .describe('q', 'Domain for pattern-handler')
    .default('q', process.env.PATTERN_HANDLER_DOMAIN || 'localhost')

    .alias('n', 'pattern-handler-port')
    .describe('n', 'Port for pattern-handler')
    .default('n', process.env.PATTERN_HANDLER_PORT || 5000)

    .alias('v', 'auto-validate-patterns')
    .describe('v', 'Automatically validate, translate, and get objects from STIX patterns')
    .boolean('v')
    .default('v', process.env.AUTO_VALIDATE_PATTERNS || true)

    // ~~~ TAXII ~~~    

    .alias('z', 'taxii-host')
    .describe('z', 'Host name and/or IP address for TAXII Server')
    .default('z', process.env.TAXII_HOST || 'localhost')

    .alias('y', 'taxii-port')
    .describe('y', 'Port for TAXII Server')
    .default('y', process.env.TAXII_PORT || 3002)

    .alias('x', 'taxii-root')
    .describe('x', 'The name of TAXII roots, or `all` to recieve data from all roots - The taxii-collection argument must be used in addition to this')
    .array('x')

    .alias('w', 'taxii-collection')
    .describe('w', 'The ID of TAXII collections, or `all` to recieve data from all collections - The taxii-root argument must be used in addition to this')
    .array('w')

    .alias('r', 'taxii-client-certificate')
    .describe('r', 'File location of the .pem certificate')

    .alias('t', 'taxii-client-key')
    .describe('t', 'File location of the .pem key')    
    
    .help('help');
    
const argv = yargs.argv;
    
export default argv;
