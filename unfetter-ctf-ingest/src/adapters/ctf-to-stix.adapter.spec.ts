import { CtfMock } from '../mocks/ctf-mock';
import { AttackPattern } from '../models/attack-pattern';
import { Ctf } from '../models/ctf';
import { MarkingDefinition } from '../models/marking-definition';
import { StixLookupMongoService } from '../services/stix-lookup-mongo.service';
import { CtfToStixAdapter } from './ctf-to-stix.adapter';

/**
 * convert to stix
 * @see https://oasis-open.github.io/cti-documentation/stix/intro
 */
describe('ctf to stix conversion', () => {

    let ctfToStixAdapter: CtfToStixAdapter;
    let lookupService: StixLookupMongoService;
    let ctfArr: Ctf[];

    beforeEach(() => {
        ctfToStixAdapter = new CtfToStixAdapter();
        ctfArr = new CtfMock().mockMany(2);
        lookupService = new StixLookupMongoService();

        spyOn(lookupService, 'findAttackPatternByName')
            .and.returnValue([new AttackPattern()]);
        spyOn(lookupService, 'findMarkingDefinitionByLabel')
            .and.returnValue([new MarkingDefinition()]);
        ctfToStixAdapter.setLookupService(lookupService);
    });

    it('should have a constructor', () => {
        expect(ctfToStixAdapter).toBeDefined();
    });

    it('should accept and not parse bad ctf objects', async () => {
        expect(ctfToStixAdapter).toBeDefined();
        const ctf = [new Ctf(), new Ctf(), ...ctfArr];
        const stixArr = await ctfToStixAdapter.convertCtfToStix(ctf);
        expect(stixArr).toBeDefined();
        expect(stixArr.length).toEqual(2);
    });

    it('should convert ctf to stix', async () => {
        const stixArr = await ctfToStixAdapter.convertCtfToStix(ctfArr);
        expect(stixArr).toBeDefined();
        expect(stixArr.length).toEqual(ctfArr.length);
        stixArr.forEach((stix) => {
            expect(stix.type).toBe('report');
        });
    });
});
