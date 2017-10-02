import { Stix } from './stix';

/**
 * @see https://stixproject.github.io/
 */
describe('stix model', () => {

    let stix: Stix;

    beforeEach(() => {
        stix = new Stix();
        stix.description = 'description';
        stix.name = 'stixname';
        stix.title = 'stixtitle';
        stix.object_refs = [ 'ref1', 'ref2' ];
        stix.created_by_ref = 'author';
    });

    it('should have a constructor', () => {
        expect(stix).toBeDefined();
    });

    it('should have a default type of report', () => {
        expect(stix.type).toBe('report');
    });

    it('should generate json', () => {
        expect(stix.toJson()).toContain('description');
        expect(stix.toJson()).toContain('stixname');
        expect(stix.toJson()).toContain('stixtitle');
        expect(stix.toJson()).toContain('author');
        expect(stix.toJson()).toContain('ref1');
        expect(stix.toJson()).toContain('ref2');
    });
});
