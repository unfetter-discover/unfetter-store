<<<<<<< HEAD
import { KillChainPhase } from 'stix/stix/kill-chain-phase';
import { StixCoreEnum } from 'stix/stix/stix-core.enum';
import { Stix } from 'stix/unfetter/stix';
import * as UUID from 'uuid';
import { AttackPatternIngest } from '../models/attack-pattern-ingest';
=======
import * as UUID from 'uuid';

import { AttackPattern } from '../models/attack-pattern';
import { AttackPatternIngest } from '../models/attack-pattern-ingest';
import { KillChainPhase } from '../models/kill-chain-phase';
import { MarkingDefinition } from '../models/marking-definition';
import { Stix } from '../models/stix';
>>>>>>> f20adeb... Rc 0.3.6 (#156)
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
        stix.type = StixCoreEnum.ATTACK_PATTERN;
        if (!attackPatternIngest) {
            return stix;
        }

        stix.created = new Date().toISOString();
        const ident = await this.lookupSystemIdentity();
        stix.created_by_ref = ident.id || '';
        stix.description = attackPatternIngest.description;
        stix.name = attackPatternIngest.action;

        const phase = new KillChainPhase(attackPatternIngest.killChain, attackPatternIngest.objective);
        if (attackPatternIngest.stage) {
            const extendedPhase: any = phase;
            extendedPhase['x_ntctf_stage'] = attackPatternIngest.stage || '';
        }
        stix.kill_chain_phases = stix.kill_chain_phases || [];
        stix.kill_chain_phases.push(phase);

<<<<<<< HEAD
=======
        if (attackPatternIngest.stage) {
            stix.extendedProperties = stix.extendedProperties || { x_ntctf_stage: '' };
            stix.extendedProperties.x_ntctf_stage = attackPatternIngest.stage;
        }

>>>>>>> f20adeb... Rc 0.3.6 (#156)
        const v4 = UUID.v4();
        const id = stix.type + '--' + v4;
        stix.id = id;
        return stix;
    }

    /**
     * @description returns the system identity
     * @return Promise<Stix>
     */
    public async lookupSystemIdentity(): Promise<Stix> {
        const oldStix = await this.lookupService.findSystemIdentity();
        const stix = Object.assign(new Stix(), oldStix, oldStix.stix);
        return Promise.resolve(stix);
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
