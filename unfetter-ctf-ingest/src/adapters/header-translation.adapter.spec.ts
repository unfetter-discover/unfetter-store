import { HeaderTranslationRule } from '../models/adapter/header-translation-rule';
import { HeaderTranslationRules } from '../models/adapter/header-translation-rules';
import { StixLookupMongoService } from '../services/stix-lookup-mongo.service';
import { HeaderTranslationAdapter } from './header-translation.adapter';

describe('Header Translation Adapter spec', () => {

    let service: HeaderTranslationAdapter;
    let lookupService: StixLookupMongoService;
    let rules: HeaderTranslationRules;
    let csv: string[];

    const buildMockRules = (): HeaderTranslationRules => {
        rules = new HeaderTranslationRules();
        rules.systemName = 'abc';

        rules.rules = [
            buildMockRule('Col A', 'IdCol'),
            buildMockRule('Col B', 'TitleCol'),
            buildMockRule('Col C', 'SummaryCol'),
        ];
        return rules;
    };

    const buildMockRule = (header: string, rewrite: string): HeaderTranslationRule => {
        const rule = new HeaderTranslationRule();
        rule.header = header;
        rule.rewrite = rewrite;
        return rule;
    };

    const buildMockPayload = (): string[] => {
        return [
            'Col A,Col B,Col C',
            'DATA_A,DATA_B,DATA_C',
        ];
    };

    beforeEach(() => {
        service = new HeaderTranslationAdapter();
        lookupService = new StixLookupMongoService();
        rules = buildMockRules();
        spyOn(lookupService, 'findHeaderTranslationRules').and.returnValue(rules);
        service.setLookupService(lookupService);
        csv = buildMockPayload()[0].split(',');
    });

    it('should have a constructor', () => {
        expect(service).toBeDefined();
    });

    it('should return original request, if system config is not found', async () => {
        const systemName = 'xxxxxx';
        const headers = await service.translateHeaders(systemName, csv);
        expect(headers).toBeDefined();
        expect(headers.length).toEqual(csv.length);
    });

    it('should return translated headers', async () => {
        const systemName = '123';
        const headers = await service.translateHeaders(systemName, csv);
        expect(headers).toBeDefined();
        expect(headers.length).toEqual(csv.length);
        expect(headers.length).toBeGreaterThan(1);
        const h1 = headers[0];
        const h2 = headers[1];
        const h3 = headers[2];
        expect(h1).toBeDefined();
        expect(h1).toEqual('IdCol');
        expect(h2).toBeDefined();
        expect(h2).toEqual('TitleCol');
        expect(h3).toBeDefined();
        expect(h3).toEqual('SummaryCol');
    });

});
