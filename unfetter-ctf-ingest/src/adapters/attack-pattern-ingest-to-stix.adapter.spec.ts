import { AttackPatternIngestMock } from '../mocks/attack-pattern-ingest.mock';
import { AttackPattern } from '../models/attack-pattern';
import { AttackPatternIngest } from '../models/attack-pattern-ingest';
import { MarkingDefinition } from '../models/marking-definition';
import { Stix } from '../models/stix';
import { StixLookupMongoService } from '../services/stix-lookup-mongo.service';
import { AttackPatternIngestToStixAdapter } from './attack-pattern-ingest-to-stix.adapter';

/**
 * convert to stix
 * @see https://oasis-open.github.io/cti-documentation/stix/intro
 */
describe('attack pattern csv to stix conversion', () => {

    let adapter: AttackPatternIngestToStixAdapter;
    let lookupService: StixLookupMongoService;
    let attackPatterns: AttackPatternIngest[];
    let mockIdent: Stix;
    let mockAttackPatterns: AttackPattern[];

    beforeEach(() => {
        mockIdent = new Stix();
        mockIdent.stix = {};
        mockIdent.stix.id = '123';
        mockIdent.id = mockIdent.stix.id;
        mockIdent.name = 'system';

        const ap = new AttackPattern();
        ap.id = 'xxx';
        mockAttackPatterns = [ap];
        adapter = new AttackPatternIngestToStixAdapter();
        lookupService = new StixLookupMongoService();

        spyOn(lookupService, 'findAttackPatternByName')
            .and.returnValue(mockAttackPatterns);
        spyOn(lookupService, 'findMarkingDefinitionByLabel')
            .and.returnValue([new MarkingDefinition()]);
        spyOn(lookupService, 'findSystemIdentity')
            .and.returnValue(mockIdent);
        adapter.setLookupService(lookupService);

        attackPatterns = new AttackPatternIngestMock().mockMany();
    });

    it('should have a constructor', () => {
        expect(adapter).toBeDefined();
    });

    it('should convert attack patterns csv to stix', async () => {
        const stixArr = await adapter.convertAttackPatternIngestToStix(attackPatterns);
        expect(stixArr).toBeDefined();
        expect(stixArr.length).toEqual(attackPatterns.length);
        stixArr.forEach((stix) => {
            expect(stix.type).toBe('attack-pattern');
        });
    });
});
