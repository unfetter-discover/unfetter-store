import { AttackPattern } from '../models/attack-pattern';
import { AttackPatternIngest } from '../models/attack-pattern-ingest';
import { Ctf } from '../models/ctf';
import { KillChainPhase } from '../models/kill-chain-phase';
import { MarkingDefinition } from '../models/marking-definition';
import { Stix } from '../models/stix';
import { StixLookupMongoService } from '../services/stix-lookup-mongo.service';

/**
 * @description
 *  Mapping keys from attack pattern csv datamodel to stix
 */
export class AttackPatternIngestToStixAdapter {

    protected stixLookupService: StixLookupMongoService;

    constructor() {
        this.stixLookupService = new StixLookupMongoService();
    }

    public setStixLookupService(service: StixLookupMongoService): void {
        this.stixLookupService = service;
    }

    /**
     * @description
     * @param array
     */
    public async convertAttackPatternIngestToStix(array: AttackPatternIngest[]): Promise<Stix[]> {
        const stixies = array.map((el) => this.mapAttackPatternIngestToStix(el));
        return Promise.all(stixies);
    }

    /**
     * @description
     * @param attackPatternIngest
     * @return {Promise<Stix>}
     */
    public async mapAttackPatternIngestToStix(attackPatternIngest: AttackPatternIngest): Promise<Stix> {
        const stix = new Stix();
        stix.type = 'attack-pattern';

        if (!attackPatternIngest) {
            return stix;
        }

        stix.created = new Date().toISOString();
        const ident: any = await this.lookupSystemIdentity();
        stix.created_by_ref = ident.stix.id;
        stix.description = attackPatternIngest.description;
        stix.name = attackPatternIngest.action;

        const phase = new KillChainPhase();
        phase.kill_chain_name = attackPatternIngest.killChain;
        phase.phase_name = attackPatternIngest.objective;
        stix.kill_chain_phases = stix.kill_chain_phases || [];
        stix.kill_chain_phases.push(phase);
        return stix;
    }

    /**
     * @param {Promise<AttackPattern[]>} name
     * @throws {Error} if name is undefined or empty
     */
    private async lookupAttackPattern(name: string = ''): Promise<AttackPattern[]> {
        if (!name || name.trim().length === 0) {
            throw new Error('name parameter is empty or not defined!');
        }

        return this.stixLookupService.findAttackPatternByName(name);
    }

    /**
     * @description
     */
    private async lookupSystemIdentity(): Promise<Stix> {
        return this.stixLookupService.findSystemIdentity();
    }

    /**
     * @description map mongo _id to .id
     * @param obj
     * @return {any} obj given, but with ._id assigend to .id
     */
    private mapMongoId(obj: any): any {
        const tmp: any = obj;
        if (tmp['_id'] && !tmp.id) {
            tmp.id = tmp['_id'];
        }
        return tmp;
    }
}
