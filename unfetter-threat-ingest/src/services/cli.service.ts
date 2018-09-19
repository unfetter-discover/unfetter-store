import * as yargs from 'yargs';
import * as fs from 'fs';

yargs

    .alias('p', 'port')
    .number('p')
    .describe('p', 'Port for sending refresh commands to this service')
    .default('p', process.env.THREAT_INGEST_PORT || 5010)

    .alias('mongo-host', 'db-host')
    .describe('mongo-host', 'Host name and/or IP address for MongoDB')
    .default('mongo-host', process.env.MONGO_HOST || 'localhost')

    .number('mongo-port')
    .alias('mongo-port', 'db-port')
    .describe('mongo-port', 'Port for MongoDB')
    .default('mongo-port', process.env.MONGO_PORT || 27018)

    .alias('mongo-database', 'db')
    .describe('mongo-database', 'Database for MongoDB')
    .default('mongo-database', process.env.MONGO_DB || 'stix')

    .hide('cert-dir')
    .default('cert-dir', '/etc/pki/tls/certs')
    .hide('server-key')
    .default('server-key', 'server.key')
    .hide('server-cert')
    .default('server-cert', 'server.crt')

    .number('i')
    .alias('i', 'refresh-interval')
    .describe('i', 'Reread the configuration every N minutes')
    .default('i', 30 /* 30 minutes */)

    .boolean('debug')
    .alias('debug', 'verbose')
    .describe('debug', 'Prints out verbose debugging messages')

    .alias('c', 'config')
    .config('c', (path) => {
        if (fs.existsSync(path)) {
            return JSON.parse(fs.readFileSync(path, 'utf-8'));
        }
        if (path !== 'config/.env') {
            console.error(`Configuration file not found at path '${path}'. Proceeding without it.`)
        }
    })
    .describe('c', 'Path for optional, JSON configuration file; can be used to read in all the above. ' +
        'If the above options are also given, they override the contents of the configuration file.')
    .default('c', 'config/.env')

    .group(['mongo-host', 'mongo-port', 'mongo-database'], 'Mongo Options:')
    .group(['p', 'i', 'c', 'debug'], 'Service Options:')

    .alias('v', 'version')
    .version()

    .alias('h', 'help')
    .help('help')

;

const argv = yargs.argv;

export default argv;
