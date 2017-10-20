import * as camelcase from 'camelcase';
import * as fs from 'fs';
import * as Papa from 'papaparse';
import { CtfToStixAdapter } from './ctf-to-stix-adapter';
import { Ctf } from './models/ctf';
import { Stix } from './models/stix';
import { MongoConnectionService } from './services/mongo-connection.service';
import { UnfetterPosterMongoService } from './services/unfetter-poster-mongo.service';
import { StixToJsonSchemaAdapter } from './stix-to-jsonschema-adapter';

/**
 * @description reads a well known ctf csv file and converts to stix
 */
export class CtfIngest {

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
        const stixToJson = new StixToJsonSchemaAdapter();
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

        console.log('await collection');
        const collection = await MongoConnectionService.getCollection();
        console.log('collection is ', collection);
        const arr = this.csvToCtf(csv);
        const adapter = new CtfToStixAdapter();
        const stixies = await adapter.convertCtfToStix(arr);

        if (stixies && stixies.length > 1) {
            console.log(`generated ${stixies.length} stix objects.`);
            // stixies.forEach((el) => console.log(JSON.stringify(el)));
        }
        return Promise.resolve(stixies);
    }

    /**
     * @description
     *  reads a well know ctf csv file and loads to csv
     * @param {string} csv representing the data
     * @throws {Error} if file does not exist
     * @returns {Ctf[]} array of parse object
     */
    public csvToCtf(csv = ''): Ctf[] {
        const parseResults = this.csvToJson(csv);
        if (parseResults.data) {
            const arr = parseResults.data.map((el) => this.jsonLineToCtf(el));
            if (arr && arr.length > 1) {
                console.log(`parsed ${arr.length} objects`);
                // console.log(arr[0].toJson());
            }
            return arr;
        }

        return [];
    }

    /**
     * @description
     *  reads this classess csv file and loads to csv
     * @param {string} csv representing the data
     * @throws {Error} if file does not exist
     * @returns {PapaParse.ParseResult} results from parse
     */
    public csvToJson(csv = ''): PapaParse.ParseResult {
        const parseResults = Papa.parse(csv, {
            quoteChar: '"',
            delimiter: ',',
            header: true,
        });

        return parseResults;
    }

    /**
     * @description
     *  csv json line to normalized ctf headers
     */
    protected jsonLineToCtf(json: any): Ctf {
        const ctf: any = new Ctf();
        if (!json) {
            return ctf;
        }

        // TODO: handle dates better
        // Convert data format with moment
        // moment(someDateStr, 'MM-DD-YYYY').format('MM-DD-YYYYT00:00.00Z');
        const keys = Object.keys(json);
        keys.forEach((key) => {
            const camelKey = camelcase(key);
            ctf[camelKey] = json[key];
        });
        return ctf;
    }

}
