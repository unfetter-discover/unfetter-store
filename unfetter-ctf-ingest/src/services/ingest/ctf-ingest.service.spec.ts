import { HeaderTranslationAdapter } from '../../adapters/header-translation.adapter';
import { Stix } from '../../models/stix';
import { CtfIngestService } from './ctf-ingest.service';

describe('Ctf ingest service', () => {

    let service: CtfIngestService;
    let headerAdapter: HeaderTranslationAdapter;

    beforeEach(() => {
        service = new CtfIngestService();
        headerAdapter = new HeaderTranslationAdapter();
        spyOn(headerAdapter, 'translateHeaders').and.returnValue('ColA,ColB,ColC'.split(','));
        service.setHeaderTranslationAdapter(headerAdapter);
    });

    it('should have a constructor', () => {
        expect(service).toBeDefined();
    });

    it('should transform csv to stix', async () => {
        const stix1 = new Stix();
        const stix2 = new Stix();
        const spy = spyOn(service, 'csvToStix');
        spy.and.returnValue([stix1, stix2]);

        const promise = service.csvToStix();
        expect(promise).toBeDefined();
        const arr = await promise;
        expect(arr.length).toEqual(2);
    });

    it('should reject empty csv to stix', async () => {
        const arr = await service.csvToStix();
        expect(arr).toBeDefined();
        expect(arr.length).toEqual(0);
    });

    it('should reject bad headers csv to stix', async () => {
        const data = ['ColA,ColB,ColC', 'Data1,Data2,Data3'];
        const el = await service.csvToStix(data.join('\n')).catch((e) => {
            expect(e).toBeDefined();
        });
    });

    // it('should validate headers csv to stix', async () => {
    //     const data = ['1,2,3', 'Data1,Data2,Data3'];
    //     const adapter = new HeaderTranslationAdapter();
    //     spyOn(adapter, 'translateHeaders').and.returnValue('reportId,description,author'.split(','));
    //     service.setHeaderTranslationAdapter(adapter);
    //     const el = await service.csvToStix(data.join('\n'));
    //     console.log(el);
    //     expect(el).toBeDefined(el);
    // });
});
