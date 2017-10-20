import { AttackPattern } from '../models/attack-pattern';
import { JsonSchema } from '../models/json-schema';
import { MarkingDefinition } from '../models/marking-definition';
import { StixLookupRestService } from './stix-lookup-rest.service';

describe('Stix lookup service', () => {

    let stixLookupService: StixLookupRestService;

    beforeEach(() => {
        stixLookupService = new StixLookupRestService();
    });

    it('should have a constructor', () => {
        expect(stixLookupService).toBeDefined();
    });

    it('should lookup attack patterns by name', async () => {
        const ap1 = new AttackPattern();
        const ap2 = new AttackPattern();
        const spy = spyOn(stixLookupService, 'findAttackPatternByName');
        spy.and.returnValue(Promise.resolve([ap1, ap2]));

        const promise = stixLookupService.findAttackPatternByName('spear phishing');
        expect(promise).toBeDefined();
        const arr = await promise;
        expect(arr.length).toEqual(2);
    });

    it('should look up markings by label', async () => {
        const high = 'High';
        const md1 = new MarkingDefinition();
        md1.id = `${md1.type}-${Math.round(Math.random() * 100)}`;
        md1.definition.label = high;
        const spy = spyOn(stixLookupService, 'findMarkingDefinitionByLabel');
        spy.and.returnValue(Promise.resolve([md1]));

        const promise = stixLookupService.findMarkingDefinitionByLabel(high);
        expect(promise).toBeDefined();
        const arr = await promise;
        expect(arr.length).toEqual(1);
        expect(arr[0].definition.label).toBe(high);
    });

});
