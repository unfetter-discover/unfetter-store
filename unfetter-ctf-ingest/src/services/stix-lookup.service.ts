import { DataTranslationRules } from '../models/adapter/data-translation-rules';
import { HeaderTranslationRules } from '../models/adapter/header-translation-rules';
import { UrlTranslationRule } from '../models/adapter/url-translation-rule';
import { AttackPattern } from '../models/attack-pattern';
import { MarkingDefinition } from '../models/marking-definition';
import { Stix } from '../models/stix';

/**
 * @description interface for lookup methods
 */
export interface StixLookupService {
    findAttackPatternByName(name: string): Promise<AttackPattern[]>;
    findMarkingDefinitionByLabel(label: string): Promise<MarkingDefinition>;
    findSystemIdentity(): Promise<Stix>;
    findIdentityByName(name: string): Promise<Stix>;
    findUrlAdapterRule(systemName: string): Promise<UrlTranslationRule>;
    findDataAdapterRules(systemName: string): Promise<DataTranslationRules>;
    findHeaderTranslationRules(systemName: string): Promise<HeaderTranslationRules>;
}
