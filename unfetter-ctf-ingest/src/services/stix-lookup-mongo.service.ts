import * as https from 'https';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';
import { Environment } from '../environment';
import { Config } from '../models/adapter/config';
import { DataTranslationRules } from '../models/adapter/data-translation-rules';
import { UrlTranslationRule } from '../models/adapter/url-translation-rule';
import { AttackPattern } from '../models/attack-pattern';
import { MarkingDefinition } from '../models/marking-definition';
import { Stix } from '../models/stix';
import { CollectionType } from './collection-type.enum';
import { MongoConnectionService } from './mongo-connection.service';
import { StixLookupService } from './stix-lookup.service';

/**
 * @description class to make calls to the Mongo database directly
 */
export class StixLookupMongoService {

    /**
     * @description
     *  lookup up attack pattern by name
     * @param {string} name
     * @returns {AttackPattern[]}
     */
    public async findAttackPatternByName(name = ''): Promise<AttackPattern[]> {
        if (!name || name.trim().length === 0) {
            return Promise.resolve([]);
        }

        const collection = await MongoConnectionService.getCollection();

        const filter = {
            'stix.name': name,
        };

        return Promise.resolve(
            collection.find(filter).toArray()
                .then((doc: any) => doc)
                .catch((error: any) => console.log(error)));
    }

    /**
     * @description lookup up marking definition by label
     * @param {string} name
     * @returns {MarkingDefinition[]}
     */
    public async findMarkingDefinitionByLabel(label = ''): Promise<MarkingDefinition> {
        if (!label || label.trim().length === 0) {
            return Promise.reject('');
        }

        const collection = await MongoConnectionService.getCollection();

        const filter = {
            'stix.definition.label': label,
        };

        return Promise.resolve(collection.findOne(filter)
            .then((result: any) => {
                return result;
            })
            .catch((error: any) => console.log(error)));
    }

    /**
     * @description lookup up marking definition by label
     * @param {string} name
     * @returns {Stix}
     */
    public async findIdentityByName(name = ''): Promise<Stix> {
        if (!name || name.trim().length === 0) {
            return Promise.reject('');
        }

        const collection = await MongoConnectionService.getCollection();

        const filter = {
            'stix.name': name,
        };

        return Promise.resolve(collection.findOne(filter)
            .then((result: any) => {
                return result;
            })
            .catch((error: any) => console.log(error)));
    }

    /**
     * @description lookup up the unfetter system identity
     * @param {string} name
     * @returns {Stix}
     */
    public async findSystemIdentity(): Promise<Stix> {
        return this.findIdentityByName('Unfetter of NSA');
    }

    /**
     * @description lookup rules to translate report urls for a given system
     * @param {string} systemName
     * @returns {UrlTranslationRule}
     */
    public async findUrlAdapterRule(systemName = ''): Promise<UrlTranslationRule> {
        if (!systemName || systemName.trim().length === 0) {
            return Promise.reject('');
        }

        const collection = await MongoConnectionService.getCollection(CollectionType.CONFIG);

        const filter = {
            'configKey': 'adapter.rules.url',
            'configValue.systemName': systemName,
        };

        return Promise.resolve(collection.findOne(filter)
            .then((result: Config) => {
                const rule = new UrlTranslationRule();
                const value = result.configValue;
                rule.replacementPattern = value.replacementPattern;
                rule.searchPattern = value.searchPattern;
                rule.systemName = value.systemName;
                return rule;
            })
            .catch((error: any) => console.log(error)));
    }

    /**
     * @description lookup rules to translate external report data for a given system
     * @param {string} systemName
     * @returns {DataTranslationRules}
     */
    public async findDataAdapterRules(systemName = ''): Promise<DataTranslationRules> {
        if (!systemName || systemName.trim().length === 0) {
            return Promise.reject('');
        }

        const collection = await MongoConnectionService.getCollection(CollectionType.CONFIG);

        const filter = {
            'configKey': 'adapter.rules.data',
            'configValue.systemName': systemName,
        };

        return Promise.resolve(collection.findOne(filter)
            .then((result: Config) => {
                const rules = new DataTranslationRules();
                const val = result.configValue;
                rules.systemName = val.systemName;
                rules.rules = val.rules;
                return rules;
            })
            .catch((error: any) => console.log(error)));
    }
}
