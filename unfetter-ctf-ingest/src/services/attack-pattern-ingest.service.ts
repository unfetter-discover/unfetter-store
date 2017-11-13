import * as fs from 'fs';
import { AttackPatternIngestToStixAdapter } from '../adapters/attack-pattern-ingest-to-stix-adapter';
import { AttackPatternIngest } from '../models/attack-pattern-ingest';
import { Stix } from '../models/stix';
import { MongoConnectionService } from '../services/mongo-connection.service';
import { UnfetterPosterMongoService } from '../services/unfetter-poster-mongo.service';
import { CsvParseService } from './parse-csv-service';
import { StixLookupMongoService } from './stix-lookup-mongo.service';

/**
 * @description reads a defined attack pattern csv file, converts to stix, ingests into unfetter db
 */
export class AttackPatternIngestService {

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
            // post to reports endpoint
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

        // important, set up the mongo connection for the app
        const collection = await MongoConnectionService.getCollection();
        const parseService = new CsvParseService<AttackPatternIngest>();
        const arr = parseService.parseCsv(csv);
        const adapter = new AttackPatternIngestToStixAdapter();
        const stixies = await adapter.convertAttackPatternIngestToStix(arr);

        if (stixies && stixies.length > 1) {
            console.log(`generated ${stixies.length} stix objects.`);
            stixies.forEach((el) => console.log(JSON.stringify(el)));
        }
        return Promise.resolve([]);
    }

}
