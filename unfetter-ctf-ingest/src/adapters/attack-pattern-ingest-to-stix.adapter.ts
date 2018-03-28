import * as UUID from 'uuid';

import { AttackPattern } from '../models/attack-pattern';
import { AttackPatternIngest } from '../models/attack-pattern-ingest';
import { KillChainPhase } from '../models/kill-chain-phase';
import { MarkingDefinition } from '../models/marking-definition';
import { Stix } from '../models/stix';
import { StixLookupMongoService } from '../services/stix-lookup-mongo.service';
import { StixLookupService } from '../services/stix-lookup.service';

/**
 * @description
 *  Mapping keys from attack pattern csv datamodel to stix
 */
export class AttackPatternIngestToStixAdapter {

    protected lookupService: StixLookupService;
    constructor() {
        this.lookupService = new StixLookupMongoService();
    }

    public setLookupService(service: StixLookupService): void {
        this.lookupService = service;
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

        if (attackPatternIngest.stage) {
            stix.extendedProperties = stix.extendedProperties || { x_ntctf_stage: '' };
            stix.extendedProperties.x_ntctf_stage = attackPatternIngest.stage;
        }
        return stix;
    }

    /**
     * @description
     */
    public async lookupSystemIdentity(): Promise<Stix> {
        return this.lookupService.findSystemIdentity();
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
