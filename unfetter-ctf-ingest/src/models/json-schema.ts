import { JsonSchemaData } from './json-schema-data';

export class JsonSchema {
    public data = new JsonSchemaData();

    public toJson(): string {
        return JSON.stringify(this, undefined, '\t');
    }
}
