import * as camelcase from 'camelcase';
import * as Papa from 'papaparse';

/**
 * @description generic csv parse to json
 * @example
 *  const service = new CsvParseService<Stix>();
 *  const arr = service.parseCsv();
 */
export class CsvParseService<Out> {

    /**
     * @description
     *  reads a well know csv file and loads to csv
     * @param {string} csv representing the data
     * @throws {Error} if file does not exist
     * @returns {Out[]} array of parse object
     */
    public parseCsv(csv = ''): Out[] {
        const parseResults = this.csvToJson(csv);
        if (parseResults.data) {
            const arr = parseResults.data.map((el) => this.jsonLineToType(el));
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
    protected csvToJson(csv = ''): PapaParse.ParseResult {
        const parseResults = Papa.parse(csv, {
            quoteChar: '"',
            delimiter: ',',
            header: true,
            skipEmptyLines: true,
        });

        return parseResults;
    }

    /**
     * @description
     *  csv json line to normalized headers
     */
    protected jsonLineToType(json: any): Out {
        const ap: any = {};
        if (!json) {
            return ap;
        }

        const keys = Object.keys(json);
        keys.forEach((key) => {
            const camelKey = camelcase(key);
            ap[camelKey] = json[key];
        });
        return ap;
    }
}
