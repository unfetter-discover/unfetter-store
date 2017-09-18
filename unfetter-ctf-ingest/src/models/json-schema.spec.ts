import { JsonSchema } from './json-schema';

/*
 * @see http://json-schema.org/
 */
describe('json schema model', () => {

    let json: JsonSchema;

    beforeEach(() => {
        json = new JsonSchema();
        json.data.type = 'sample';
    });

    it('should have a constructor', () => {
        expect(json).toBeDefined();
        expect(json.data).toBeDefined();
        expect(json.data.type).toBeDefined();
        expect(json.data.attributes).toBeDefined();
    });

});
