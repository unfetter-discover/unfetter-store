import { Stix } from '../../models/stix';
import { AttackPatternIngestService } from './attack-pattern-ingest.service';

describe('Ctf ingest service', () => {

    let service: AttackPatternIngestService;

    beforeEach(() => {
        service = new AttackPatternIngestService();
    });

    it('should have a constructor', () => {
        expect(service).toBeDefined();
    });

    it('should transform csv to stix', async () => {
        const stix1 = new Stix();
        const stix2 = new Stix();
        const spy = spyOn(service, 'csvToStix');
        spy.and.returnValue([ stix1, stix2 ]);

        const promise = service.csvToStix();
        expect(promise).toBeDefined();
        const arr = await promise;
        expect(arr.length).toEqual(2);
    });

});
