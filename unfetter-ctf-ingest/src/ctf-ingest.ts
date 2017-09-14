
import * as camelcase from 'camelcase';
import * as fs from 'fs';
import * as Papa from 'papaparse';
import { CtfAdapter } from './ctf-adapter';
import { Ctf } from './models/ctf';
import { Stix } from './models/stix';

/**
 * @description reads a well known ctf csv file and converts to stix
 */
export class CtfIngest {

    /**
     * @description
     *  reads a well know ctf csv file and converts it to stix objects
     * @param {string} fileName
     */
    public csvToStix(fileName: string = ''): Stix[] {
        const arr = this.csvToCtf(fileName);
        const adapter = new CtfAdapter();
        const stixies = adapter.convertCtfToStix(arr);

        if (stixies && stixies.length > 1) {
            console.log(`generated ${stixies.length} stix objects. Listing first object`);
            console.log(stixies[0].toJson());
        }
        return stixies;
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
                console.log(`parsed ${arr.length} objects.  Listing first one`);
                console.log(arr[0].toJson());
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

        const keys = Object.keys(json);
        keys.forEach((key) => {
            const camelKey = camelcase(key);
            ctf[camelKey] = json[key];
        });
        return ctf;
    }

}
