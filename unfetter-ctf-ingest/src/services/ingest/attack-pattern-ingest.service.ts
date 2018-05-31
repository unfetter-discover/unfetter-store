import * as fs from 'fs';
import { Stix } from 'stix/unfetter/stix';
import { StixBundle } from 'stix/unfetter/stix-bundle';
import { AttackPatternIngestToStixAdapter } from '../../adapters/attack-pattern-ingest-to-stix.adapter';
import { AttackPatternIngest } from '../../models/attack-pattern-ingest';
import { MongoConnectionService } from '../../services/mongo-connection.service';
import { UnfetterPosterMongoService } from '../../services/unfetter-poster-mongo.service';
import { CollectionType } from '../collection-type.enum';
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
            console.log(`generated ${stixies.length} stix attack patterns.`);
        }

        const reducedAttackPatterns = await this.collapseAttackPatternsAcrossPhases(stixies);
        if (reducedAttackPatterns && reducedAttackPatterns.length > 1) {
            console.log(`reduced to ${reducedAttackPatterns.length} attack patterns.`);
        }
        return Promise.resolve(reducedAttackPatterns);
    }

    /**
     * @param  {Stix[]} attackPatterns
     * @returns Promise
     */
    public async collapseAttackPatternsAcrossPhases(attackPatterns: Stix[] = []): Promise<Stix[]> {
        if (!attackPatterns || attackPatterns.length === 0) {
            return Promise.resolve(attackPatterns);
        }

        const arr = attackPatterns
            .map((el) => {
                const name = el.name;
                const arrByName = attackPatterns.filter((_) => _.name === name) || [];
                if (arrByName.length > 1) {
                    const first = arrByName[0];
                    if (first.id === el.id) {
                        first.kill_chain_phases = first.kill_chain_phases || [];
                        const lastPhases = arrByName
                            .slice(1, arrByName.length)
                            .map((byName) => byName.kill_chain_phases || [])
                            .reduce((acc, x) => acc.concat(x), []);
                        first.kill_chain_phases = [...first.kill_chain_phases, ...lastPhases];
                        return first;
                    } else {
                        return undefined;
                    }
                } else if (arrByName.length === 1) {
                    return arrByName[0];
                } else {
                    const msg = `warning, trouble finding attack pattern ${name} while collapsing phases, moving on...`;
                    console.warn(msg);
                    return undefined;
                }
            })
            .filter((el) => el !== undefined);

        return Promise.resolve(arr as Stix[]);
    }

}
