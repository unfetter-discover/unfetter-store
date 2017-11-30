import * as camelcase from 'camelcase';
import * as fs from 'fs';
import * as Papa from 'papaparse';
import { CtfToStixAdapter } from '../../adapters/ctf-to-stix.adapter';
import { Ctf } from '../../models/ctf';
import { Stix } from '../../models/stix';
import { MongoConnectionService } from '../../services/mongo-connection.service';
import { UnfetterPosterMongoService } from '../../services/unfetter-poster-mongo.service';
import { CollectionType } from '../collection-type.enum';
import { HeaderValidationService } from './header-validation.service';
import { CsvParseService } from './parse-csv-service';

/**
 * @description reads a well known ctf csv file and converts to stix
 */
export class CtfIngestService {

    protected validationService: HeaderValidationService;
    constructor() {
        this.validationService = new HeaderValidationService();
    }

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
        const stixies = await this.csvToStix(csv);
        const unfetterPoster = new UnfetterPosterMongoService();
        return Promise.resolve(unfetterPoster.uploadStix(stixies));
    }

    /**
     * @description reads a well know ctf csv file and converts it to stix objects
     * @param {string} csv representing the data
     */
    public async csvToStix(csv = ''): Promise<Stix[]> {
        if (!csv || csv.trim().length === 0) {
            return Promise.resolve([]);
        }

        await this.ensureExpectedHeaders(csv);
        const collection = await MongoConnectionService.getCollection(CollectionType.DATA);
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

    /**
     * @description make sure there is a sembalance of correctness to the given headers
     * @param {string} csv
     * @throws {Error} if the headers do not seem correct
     * @return {Promise<boolean>}
     */
    protected async ensureExpectedHeaders(csv = ''): Promise<boolean> {
        if (!csv || csv.trim().length === 0) {
            return Promise.resolve(false);
        }

        const headers = csv.split('\n');
        if (!headers || headers.length < 1) {
            return Promise.resolve(false);
        }

        const headerArr = headers[0].split(',');
        const targetKeys = Object.keys(new Ctf());
        const valid = await this.validationService.verifyCorrectHeaders(targetKeys, headerArr);
        if (valid === false) {
            const msg =
                'headers do not look correct, expected at least some of the following camel or noncamel case variants\n'
                + `${targetKeys.join(',')}`;
            throw msg;
        }

        return valid;
    }

}
