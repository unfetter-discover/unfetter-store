import * as camelcase from 'camelcase';
import * as fs from 'fs';
import * as Papa from 'papaparse';
import { CtfToStixAdapter } from '../../adapters/ctf-to-stix.adapter';
import { HeaderTranslationAdapter } from '../../adapters/header-translation.adapter';
import { Ctf } from '../../models/ctf';
import { Stix } from '../../models/stix';
import { StixBundle } from '../../models/stix-bundle';
import { MongoConnectionService } from '../../services/mongo-connection.service';
import { UnfetterPosterMongoService } from '../../services/unfetter-poster-mongo.service';
import { CollectionType } from '../collection-type.enum';
import { StixLookupMongoService } from '../stix-lookup-mongo.service';
import { StixLookupService } from '../stix-lookup.service';
import { HeaderValidationService } from './header-validation.service';
import { CsvParseService } from './parse-csv-service';

/**
 * @description reads a well known ctf csv file and converts to stix
 */
export class CtfIngestService {

    protected validationService: HeaderValidationService;
    protected headerTranslationAdapter: HeaderTranslationAdapter;
    protected lookupService: StixLookupService;
    constructor() {
        this.validationService = new HeaderValidationService();
        this.lookupService = new StixLookupMongoService();
        this.headerTranslationAdapter = new HeaderTranslationAdapter();
        this.headerTranslationAdapter.setLookupService(this.lookupService);
    }

    public setLookupService(lookupService: StixLookupService): void {
        this.lookupService = lookupService;
    }

    public setHeaderTranslationAdapter(adapter: HeaderTranslationAdapter): void {
        this.headerTranslationAdapter = adapter;
    }

    /**
     * @description ingest a csv file
     * @param {string} fileName
     * @return {Promise<void>}
     */
    public async ingestCsv(fileName: string = '', outFile?: string): Promise<void> {
        console.log(`ingest csv = ${fileName}`);
        if (!fs.existsSync(fileName)) {
            const msg = `${fileName} does not exist!`;
            throw msg;
        }

        if (outFile && fs.existsSync(outFile)) {
            const msg = `${outFile} already exists!`;
            throw msg;
        }

        const csv = fs.readFileSync(fileName).toString();
        const stixies = await this.csvToStix(csv);

        if (!outFile) {
            const unfetterPoster = new UnfetterPosterMongoService();
            // post to reports endpoint
            return Promise.resolve(unfetterPoster.uploadStix(stixies));
        } else {
            console.log('saving to file ', outFile);
            const bundle = new StixBundle();
            bundle.objects = stixies;
            fs.writeFileSync(outFile, bundle.toJson());
        }
    }

    /**
     * @description reads a well know ctf csv file and converts it to stix objects
     * @param {string} csv representing the data
     */
    public async csvToStix(csv = ''): Promise<Stix[]> {
        if (!csv || csv.trim().length === 0) {
            return Promise.resolve([]);
        }

        const lineDelim = '\n';
        const headers = this.extractHeaders(csv, lineDelim);
        const systemName = 'sample-report-system';
        const translatedHeaders = await this.headerTranslationAdapter.translateHeaders(systemName, headers);
        const hasSaneHeaders = await this.ensureExpectedHeaders(translatedHeaders);
        if (!hasSaneHeaders) {
            console.log('bad headers, rejecting promise');
            const targetKeys = Object.keys(new Ctf());
            const msg =
                'headers do not look correct, expected at least some of the following camel or noncamel case variants'
                + '\n'
                + `${targetKeys.join(',')}`;
            return Promise.reject(msg);
        }

        let data = csv.split(lineDelim);
        data = data.splice(1, data.length);
        const translatedData = [translatedHeaders.join(','), ...data];
        const translatedCsv = translatedData.join(lineDelim);
        const collection = await MongoConnectionService.getCollection(CollectionType.DATA);
        const parseService = new CsvParseService<Ctf>();
        const arr = parseService.parseCsv(translatedCsv);
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
    protected async ensureExpectedHeaders(headers: string[]): Promise<boolean> {
        if (!headers || headers.length === 0) {
            return Promise.resolve(false);
        }

        const targetKeys = Object.keys(new Ctf());
        const valid = await this.validationService.verifyCorrectHeaders(targetKeys, headers);
        return Promise.resolve(valid);
    }

    /**
     * @description take a csv string and extract the headers from the first line
     * @param csv
     */
    protected extractHeaders(data: string, lineDelim = '\n', fieldDelim = ','): string[] {
        const headers = data.split(lineDelim);
        if (!headers || headers.length < 1) {
            return [];
        }

        const headerArr = headers[0].split(fieldDelim);
        return headerArr;
    }

}
