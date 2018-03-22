import { AttackPattern } from '../models/attack-pattern';
import { JsonSchema } from '../models/json-schema';
import { KillChainPhase } from '../models/kill-chain-phase';
import { Stix } from '../models/stix';

/**
 * @description
 *  Mapping keys from stix datamodel to jsonschema
 *
 * @see http://json-schema.org/ for Json Schema
 * @see https://oasis-open.github.io/cti-documentation/ for STIX 2.0
 * @see ./api/explorer/ for the Unfetter Swagger API definitions
 */
export class StixToJsonSchemaAdapter {

    public convertStixToJsonSchema(arr: Stix[]): JsonSchema[] {
        if (!arr || arr.length < 1) {
            return [];
        }

        const jsonArr = arr.map((el) => this.mapStixToJsonSchema(el));
        return jsonArr;
    }

    /**
     * @description copies stix values into jsonschema
     * @param {Stix} stix
     * @return {JsonSchema}
     */
    public mapStixToJsonSchema(stix: Stix): JsonSchema {
        if (!stix) {
            throw new Error('stix object is undefined!');
        }

        const keys = Object.keys(stix);
        const jsonSchema = new JsonSchema();
        keys.forEach((key) => {
            if (key === 'type') {
                jsonSchema.data.type = stix.type;
                return;
            }

            jsonSchema.data.attributes[key] = (stix as any)[key];
        });
        return jsonSchema;
    }
}
