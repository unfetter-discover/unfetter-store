import * as https from 'https';
import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';
import { Environment } from '../environment';
import { AttackPattern } from '../models/attack-pattern';
import { MarkingDefinition } from '../models/marking-definition';
import { MongoConnectionService } from './mongo-connection.service';
import { StixLookupService } from './stix-lookup-service';

/**
 * @description class to make calls to the Mongo database directly
 */
export class StixLookupMongoService {

    protected readonly attackPatternPath = `attack-patterns`;
    protected readonly markingDefinitionsPath = `marking-definitions`;

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

}
