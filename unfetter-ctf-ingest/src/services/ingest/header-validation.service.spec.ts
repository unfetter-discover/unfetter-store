import { ReportCtf } from '../../models/report-ctf';
import { HeaderValidationService } from './header-validation.service';

describe('Header validation service spec', () => {

    let service: HeaderValidationService;
    let targetKeys: string[];
    let headers: string[];

    beforeEach(() => {
        service = new HeaderValidationService();
        targetKeys = Object.keys(new ReportCtf());
        const str =
            'Report Id,Title,Source Type,ALA Stage,AFA Objective,AFA Action,Description,Action Paragraph,'
            + 'Action Classification,Report Classification,Report DTG,'
            + 'Declassification,ALA,AMA,AFA,AUTHOR,ADDED DTG,QC AUTHOR,QC DTG';
        headers = str.split(',');
    });

    it('should have a constructor', () => {
        expect(service).toBeDefined();
    });

    it('should verify partial overlap of headers and target object keys', async () => {
        const promise = service.verifyCorrectHeaders(targetKeys, headers, false);
        expect(promise).toBeDefined();
        const valid = await promise;
        expect(valid).toBeTruthy();
    });

    it('should verify complete overlap of headers and target object keys', async () => {
        const promise = service.verifyCorrectHeaders(targetKeys, [...headers, 'notarealheader'], true);
        expect(promise).toBeDefined();
        const valid = await promise;
        expect(valid).toBeFalsy();
    });

    it('should return false on empty params', async () => {
        const promise = service.verifyCorrectHeaders(undefined, undefined, undefined);
        expect(promise).toBeDefined();
        const valid = await promise;
        expect(valid).toBeFalsy();
    });
});
