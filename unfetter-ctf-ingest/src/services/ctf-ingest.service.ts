import * as camelcase from 'camelcase';
import * as fs from 'fs';
import * as Papa from 'papaparse';
import { CtfToStixAdapter } from '../adapters/ctf-to-stix-adapter';
import { Ctf } from '../models/ctf';
import { Stix } from '../models/stix';
import { MongoConnectionService } from '../services/mongo-connection.service';
import { UnfetterPosterMongoService } from '../services/unfetter-poster-mongo.service';
import { CsvParseService } from './parse-csv-service';

/**
 * @description reads a well known ctf csv file and converts to stix
 */
export class CtfIngestService {

    /**
     * @description ingest a csv file
     * @param {string} fileName
     * @return {Promise<void>}
     */
    public async ingestCsv(fileName: string = ''): Promise<void> {
        console.log(`ingest csv = ${fileName}`);
        if (!fs.existsSync(fileName)) {
            const msg = `${fileName} does not exist!`;
            throw msg;
        }
        const csv = fs.readFileSync(fileName).toString();
        try {
            const stixies = await this.csvToStix(csv);
            const unfetterPoster = new UnfetterPosterMongoService();
            return Promise.resolve(unfetterPoster.uploadStix(stixies));
        } catch (e) {
            console.log(e);
        }
        return Promise.resolve();
    }

    /**
     * @description reads a well know ctf csv file and converts it to stix objects
     * @param {string} csv representing the data
     */
    public async csvToStix(csv = ''): Promise<Stix[]> {
        if (!csv || csv.trim().length === 0) {
            return Promise.resolve([]);
        }

        console.log('await collection');
        const collection = await MongoConnectionService.getCollection();
        console.log('collection is ', collection);
        const parseService = new CsvParseService<Ctf>();
        const arr = parseService.parseCsv(csv);
        const adapter = new CtfToStixAdapter();
        const stixies = await adapter.convertCtfToStix(arr);

        if (stixies && stixies.length > 1) {
            console.log(`generated ${stixies.length} stix objects.`);
            // stixies.forEach((el) => console.log(JSON.stringify(el)));
        }
        return Promise.resolve(stixies);
    }

}
