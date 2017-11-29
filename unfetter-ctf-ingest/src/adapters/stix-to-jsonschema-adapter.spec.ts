import { StixMock } from '../mocks/stix-mock';
import { Stix } from '../models/stix';
import { CtfToStixAdapter } from './ctf-to-stix.adapter';
import { StixToJsonSchemaAdapter } from './stix-to-jsonschema.adapter';

/**
 * reorder stix to jsonschema
 * @see https://oasis-open.github.io/cti-documentation/stix/intro
 * @see http://json-schema.org/
 */
describe('reorder stix to be in jsonschema format', () => {

    let stixToJsonSchemaAdapter: StixToJsonSchemaAdapter;
    let stixArr: Stix[];

    beforeEach(() => {
        stixToJsonSchemaAdapter = new StixToJsonSchemaAdapter();
        stixArr = new StixMock().mockMany(4);
    });

    it('should have a constructor', () => {
        expect(stixToJsonSchemaAdapter).toBeDefined();
    });

    it('should convert stix to jsonschema', () => {
        const arr = stixToJsonSchemaAdapter.convertStixToJsonSchema(stixArr);
        console.log(arr);
        expect(arr).toBeDefined();
        expect(arr.length).toEqual(4);
        arr.forEach((el) => {
            expect(el).toBeDefined();
            expect(el.data).toBeDefined();
            expect(el.data.type).toEqual('report');
            expect(el.data.attributes).toBeDefined();
        });
    });

});
