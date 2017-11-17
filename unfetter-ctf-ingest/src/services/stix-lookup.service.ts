import { AttackPattern } from '../models/attack-pattern';
import { MarkingDefinition } from '../models/marking-definition';
import { Stix } from '../models/stix';

/**
 * @description interface for lookup methods
 */
export interface StixLookupService {
    findSystemIdentity(): Promise<Stix>;
    findIdentityByName(name: string): Promise<Stix[]>;
    findAttackPatternByName(name: string): Promise<any[]>;
    findMarkingDefinitionByLabel(label: string): Promise<any[]>;
}
