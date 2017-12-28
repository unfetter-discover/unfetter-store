import * as fs from 'fs';
import { AttackPatternIngestToStixAdapter } from '../../adapters/attack-pattern-ingest-to-stix.adapter';
import { AttackPatternIngest } from '../../models/attack-pattern-ingest';
import { Stix } from '../../models/stix';
import { StixBundle } from '../../models/stix-bundle';
import { MongoConnectionService } from '../../services/mongo-connection.service';
import { UnfetterPosterMongoService } from '../../services/unfetter-poster-mongo.service';
import { CollectionType } from '../collection-type.enum';
import { StixLookupMongoService } from '../stix-lookup-mongo.service';
import { CsvParseService } from './parse-csv-service';

/**
 * @description reads a defined attack pattern csv file, converts to stix, ingests into unfetter db
 */
export class AttackPatternIngestService {

    protected adapter: AttackPatternIngestToStixAdapter;

    constructor() {
        this.adapter = new AttackPatternIngestToStixAdapter();
    }

    public setAttackPatternIngestToStixAdapter(adapter: AttackPatternIngestToStixAdapter): void {
        this.adapter = adapter;
    }

    /**
     * @description ingest a csv file
     * @param {string} fileName
     * @param {string} outFile optional
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

        // important, set up the mongo connection for the app
        const collection = await MongoConnectionService.getCollection(CollectionType.CONFIG);
        const parseService = new CsvParseService<AttackPatternIngest>();
        const arr = parseService.parseCsv(csv);
        const stixies = await this.adapter.convertAttackPatternIngestToStix(arr);

        if (stixies && stixies.length > 1) {
            console.log(`generated ${stixies.length} stix objects.`);
            // stixies.forEach((el) => console.log(el.toJson()));
        }
        return Promise.resolve(stixies);
    }

}
