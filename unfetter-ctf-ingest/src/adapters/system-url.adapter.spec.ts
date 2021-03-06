import { UrlTranslationRequest } from '../models/adapter/url-translation-request';
import { UrlTranslationResponse } from '../models/adapter/url-translation-response';
import { UrlTranslationRule } from '../models/adapter/url-translation-rule';
import { StixLookupMongoService } from '../services/stix-lookup-mongo.service';
import { SystemUrlAdapter } from './system-url.adapter';

describe('URL Adapter spec', () => {

    let service: SystemUrlAdapter;
    let lookupService: StixLookupMongoService;
    let rule: UrlTranslationRule;

    beforeEach(() => {
        service = new SystemUrlAdapter();
        lookupService = new StixLookupMongoService();

        rule = new UrlTranslationRule();
        rule.systemName = 'abc';
        rule.searchPattern = 'https://(.*)\/(.*)$';
        rule.replacementPattern = 'https://domian.next/report/$2?accept=application/json';

        spyOn(lookupService, 'findUrlAdapterRule').and.returnValue(rule);
        service.setLookupService(lookupService);
    });

    it('should have a constructor', () => {
        expect(service).toBeDefined();
    });

    it('should apply url translation rules', async () => {
        const req = new UrlTranslationRequest();
        req.systemName = 'abc';
        req.url = 'https://domain.org/report/path/123';

        const res = await service.translateUrl(req);
        expect(res).toBeDefined();
        expect(res.translated.success).toBeTruthy();
        expect(res.translated.url).toEqual('https://domian.next/report/123?accept=application/json');
    });

    it('should reject an malformed URL', async () => {
        const req = new UrlTranslationRequest();
        req.systemName = 'abc';
        req.url = 'notaURL';

        const res: UrlTranslationResponse = await service.translateUrl(req);
            // .catch((ex) => {
            //     return ex;
            // });
        expect(res).toBeDefined();
        expect(res.request).toBeDefined();
        expect(res.translated.success).toBeFalsy();
        expect(res.translated.url).toEqual(req.url);
    });
});
