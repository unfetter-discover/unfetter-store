
import * as camelcase from 'camelcase';
import * as fs from 'fs';
import * as Papa from 'papaparse';
import { CtfToStixAdapter } from './ctf-to-stix-adapter';
import { Ctf } from './models/ctf';
import { Stix } from './models/stix';
import { UnfetterPosterService } from './services/unfetter-poster.service';
import { StixToJsonSchemaAdapter } from './stix-to-jsonschema-adapter';

/**
 * @description reads a well known ctf csv file and converts to stix
 */
export class CtfIngest {

    public async ingestCsv(fileName: string = ''): Promise<void> {
        const stixToJson = new StixToJsonSchemaAdapter();
        try {
            const stixies = await this.csvToStix(fileName);
            const jsonArr = stixToJson.convertStixToJsonSchema(stixies);
            // console.log(`json data to post ${jsonArr}`);
            // jsonArr.forEach((json) => {
            //     console.log(json.toJson());
            // });
            // post to reports endpoint
            const unfetterPoster = new UnfetterPosterService();
            const results  = await unfetterPoster.uploadJsonSchema(jsonArr);
            console.log(`results ${results.length}`);
            // if (results) {
            //     results.forEach((result) => {
            //         console.log(result);
            //         const r = result.results || result.errors;
            //         if (r) {
            //             console.log(JSON.stringify(r, undefined, '\t'));
            //         }
            //     });
            // }
        } catch (e) {
            console.log(e);
        }
        return Promise.resolve();
    }

    /**
     * @description
     *  reads a well know ctf csv file and converts it to stix objects
     * @param {string} fileName
     */
    public async csvToStix(fileName: string = ''): Promise<Stix[]> {
        const arr = this.csvToCtf(fileName);
        const adapter = new CtfToStixAdapter();
        const stixies = await adapter.convertCtfToStix(arr);

        if (stixies && stixies.length > 1) {
            console.log(`generated ${stixies.length} stix objects.`);
            // stixies.forEach((el) => console.log(el.toJson()));
        }
        return Promise.resolve(stixies);
    }

    /**
     * @description
     *  reads a well know ctf csv file and loads to csv
     * @throws {Error} if file does not exist
     * @returns {Ctf[]} array of parse object
     */
    public csvToCtf(fileName: string = ''): Ctf[] {
        const parseResults = this.csvToJson(fileName);
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
     * @throws {Error} if file does not exist
     * @returns {PapaParse.ParseResult} results from parse
     */
    public csvToJson(fileName: string = ''): PapaParse.ParseResult {
        console.log(`parse csv to json file = ${fileName}`);
        if (!fs.existsSync(fileName)) {
            const msg = `${fileName} does not exist!`;
            throw msg;
        }

        const csvData = fs.readFileSync(fileName).toString();
        const parseResults = Papa.parse(csvData, {
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
