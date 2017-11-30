import { DataTranslationRule } from '../models/adapter/data-translation-rule';
import { DataTranslationRules } from '../models/adapter/data-translation-rules';
import { ExternalDataTranslationRequest } from '../models/adapter/external-data-translation-request';
import { StixLookupMongoService } from '../services/stix-lookup-mongo.service';
import { ExternalDataToStixAdapter } from './external-data-to-stix.adapter';

describe('External Data to Stix Adapter spec', () => {

    let service: ExternalDataToStixAdapter;
    let stixLookupService: StixLookupMongoService;
    let rules: DataTranslationRules;

    const buildMockRules = (): DataTranslationRules => {
        rules = new DataTranslationRules();
        rules.systemName = 'abc';

        rules.rules = [
            buildMockRule('.xxxx', 'stix.id'),
            buildMockRule('.id', 'stix.id'),
            buildMockRule('.type', 'stix.type'),
            buildMockRule('.published', 'stix.published'),
            buildMockRule('.description', 'stix.description'),
            buildMockRule('.protection.level', 'stix.granular_markings.marking_ref'),
            buildMockRule('.report.id', 'stix.external_references.external_id'),
            buildMockRule('.report.url', 'stix.external_references.url'),
            buildMockRule('.report.description', 'stix.external_references.description'),
        ];
        return rules;
    };

    const buildMockRule = (jsonPath: string, stixPath: string): DataTranslationRule => {
        const rule = new DataTranslationRule();
        rule.jsonPath = jsonPath;
        rule.stixPath = stixPath;
        return rule;
    };

    const buildMockPayload = (): any => {
        return {
            id: '123',
            description: 'description',
            type: 'report',
            published: new Date(),
            protection: {
                level: 'Medium',
            },
            report: {
                id: 'report-123',
                url: 'report.url',
                description: 'report description',
            },
        };
    };

    beforeEach(() => {
        service = new ExternalDataToStixAdapter();
        stixLookupService = new StixLookupMongoService();
        rules = buildMockRules();
        spyOn(stixLookupService, 'findDataAdapterRules').and.returnValue(rules);
        service.setStixLookupService(stixLookupService);
    });

    it('should have a constructor', () => {
        expect(service).toBeDefined();
    });

    it('should reject request, if payload is not found', async () => {
        const req = new ExternalDataTranslationRequest();
        req.systemName = 'xxxx';
        const res = await service.translateData(req).catch((e) => e);
        expect(res).toBeDefined();
        expect(res.translated.success).toBeFalsy();
    });

    it('should report a failure, if system configuration is not found', async () => {
        const lookupService = new StixLookupMongoService();
        spyOn(lookupService, 'findDataAdapterRules').and.returnValue(undefined);
        service.setStixLookupService(lookupService);

        const req = new ExternalDataTranslationRequest();
        req.systemName = 'xxxx';
        req.payload = buildMockPayload();
        const res = await service.translateData(req);
        expect(res).toBeDefined();
        expect(res.translated.success).toBeFalsy();
    });

    it('should translation for a given system', async () => {
        const req = new ExternalDataTranslationRequest();
        req.systemName = 'abc';
        req.payload = buildMockPayload();
        const res = await service.translateData(req);
        expect(res).toBeDefined();
        expect(res.translated.success).toBeTruthy();

        const payload = res.translated.payload.stix;
        expect(payload).toBeDefined();
        expect(payload.id).toBeDefined();
        expect(payload.description).toBeDefined();
        expect(payload.published).toBeDefined();
        expect(payload.granular_markings).toBeDefined();
        expect(Array.isArray(payload.granular_markings)).toBeTruthy();
        expect(payload.granular_markings.length).toEqual(1);
        expect(payload.granular_markings[0].marking_ref).toBeDefined();
        expect(Array.isArray(payload.external_references)).toBeTruthy();
        expect(payload.external_references[0].external_id).toEqual('report-123');
        expect(payload.external_references[0].url).toEqual('report.url');
        expect(payload.external_references[0].description).toEqual('report description');
    });

});
