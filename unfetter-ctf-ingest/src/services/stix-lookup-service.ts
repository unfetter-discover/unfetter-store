import { AttackPattern } from '../models/attack-pattern';
import { MarkingDefinition } from '../models/marking-definition';

export interface StixLookupService {
    findAttackPatternByName(name: string): Promise<any[]>;
    findMarkingDefinitionByLabel(label: string): Promise<any[]>;
}
