import PatternHandlerService, { PatternHandlerTranslateAll, PatternHandlerGetObjects } from './pattern-handler.service';
import { IUFStix } from '../models/interfaces';

describe('PatternHandlerService', () => {

    let mockIndicators: IUFStix[];

    const mockTranslateAllRet: PatternHandlerTranslateAll = {
        'cim-splunk': 'foo1',
        'car-splunk': 'foo2',
        'car-elastic': 'foo3',
        validated: true,
        pattern: 'foo'
    };

    const mockGetObjectsRet: PatternHandlerGetObjects = {
        validated: true,
        pattern: 'foo',
        object: [
            {
                name: 'foo',
                property: 'bar'
            }
        ]
    };

    const mockPatternInvalidRet: PatternHandlerTranslateAll | PatternHandlerGetObjects | any = {
        pattern: 'foo',
        validated: false
    };

    let translateSpy;
    let objectSpy;

    beforeEach(() => {        
        mockIndicators = [
            {
                _id: 'abc',
                stix: { id: 'abc', pattern: 'foo' },
                metaProperties: {}
            },
            {
                _id: 'def',
                stix: { id: 'def', pattern: 'bar' }
            }
        ];
    });

    it('should handle successful translations correctly', (done) => {
        translateSpy = spyOn(PatternHandlerService, 'getTranslations').and.returnValue(Promise.resolve(mockTranslateAllRet));
        objectSpy = spyOn(PatternHandlerService, 'getObjects').and.returnValue(Promise.resolve(mockGetObjectsRet));
        PatternHandlerService.handlePatterns(mockIndicators)
            .then((_) => {
                mockIndicators
                    .forEach((indicator) => {
                        expect(indicator.metaProperties).toBeDefined();

                        expect(indicator.metaProperties.queries).toBeDefined();
                        expect(indicator.metaProperties.queries.cimSplunk.query).toBe(mockTranslateAllRet['cim-splunk']);
                        expect(indicator.metaProperties.queries.carSplunk.query).toBe(mockTranslateAllRet['car-splunk']);
                        expect(indicator.metaProperties.queries.carElastic.query).toBe(mockTranslateAllRet['car-elastic']);

                        expect(indicator.metaProperties.observedData).toBeDefined();
                        expect(indicator.metaProperties.observedData[0]).toEqual({ ...mockGetObjectsRet.object[0], action: '*' });
                    });
                done();
            });
    });

    it('should handle unsuccessful translations correctly', (done) => {
        translateSpy = spyOn(PatternHandlerService, 'getTranslations').and.returnValue(Promise.resolve(mockPatternInvalidRet));
        objectSpy = spyOn(PatternHandlerService, 'getObjects').and.returnValue(Promise.resolve(mockPatternInvalidRet));
        PatternHandlerService.handlePatterns(mockIndicators)
            .then((_) => {
                expect(Object.keys(mockIndicators[0].metaProperties).length).toBe(0);
                expect(mockIndicators[1].metaProperties).not.toBeDefined();
                done();
            });
    });
});
