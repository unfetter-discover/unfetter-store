import { AttackPattern } from './attack-pattern';

/**
 * Stix attack pattern
 * @see https://oasis-open.github.io/cti-documentation/stix/intro
 */
describe('attack pattern model', () => {

    let ap: AttackPattern;

    beforeEach(() => {
        ap = new AttackPattern();
        ap.id = `${ap.type}-${Math.random()}`;
    });

    it('should have a constructor', () => {
        expect(ap).toBeDefined();
        expect(ap.id).toBeDefined();
    });

    it('should be of type attack-pattern', () => {
        expect(ap.type).toBeDefined();
        expect(ap.type).toEqual('attack-pattern');
    });

});
