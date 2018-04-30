import StixToUnfetterAdapater from './stix-to-unfetter.adapter';
import TestHelpers from '../testing/test-helpers';
import { IStix } from '../models/interfaces';

describe('StixToUnfetterAdapater', () => {

    const modifiedString = '2018-04-18T17:59:24.739Z';

    const mockStix = [
        {
            _id: '1234',
            stix: {
                modified: modifiedString
            }
        },
        {
            _id: '4567',
            stix: {
                modified: modifiedString
            },
            metaProperties: {
                fake: 'fake'
            }
        }
    ];

    const mockStixEnhancements = [
        {
            id: '4567',
            extendedProperties: {
                x_fake_prop: 'test'
            }
        },
        {
            id: 'not-a-real-id'
        }
    ];

    describe('enhanceStix', () => {
        it('should enhanced STIX', () => {
            const mockStixSafe = TestHelpers.safeObjectArrayCopy(mockStix);
            StixToUnfetterAdapater.enhanceStix(mockStixSafe, mockStixEnhancements);
            expect(mockStixSafe[1].extendedProperties.x_fake_prop).toBe('test');
        });
    });
    
    describe('autoPublish', () => {
        it('should publish STIX', () => {
            const mockStixSafe = TestHelpers.safeObjectArrayCopy(mockStix);
            StixToUnfetterAdapater.autoPublish(mockStixSafe);
            expect(mockStixSafe[0].metaProperties.published).toBeTruthy();
            expect(mockStixSafe[1].metaProperties.published).toBeTruthy();
        });
    });

    describe('saveModified', () => {
        it('should save modified property from STIX in metaProperties', () => {
            const mockStixSafe = TestHelpers.safeObjectArrayCopy(mockStix);
            StixToUnfetterAdapater.saveModified(mockStixSafe);
            expect(mockStixSafe[0].metaProperties.modified_at_ingest.toISOString()).toBe(modifiedString);
            expect(mockStixSafe[1].metaProperties.modified_at_ingest.toISOString()).toBe(modifiedString);
        });
    });

    describe('stixToUnfetterStix', () => {
        const mockIngest: IStix[] = [
            {
                id: '1234',
                name: 'test1',
                x_fake_prop: 'fake1'
            },
            {
                id: '5678',
                name: 'test2',
                x_fake_prop: 'fake2'
            }
        ];

        it('should convert a STIX document to Unfetter STIX data model', () => {
            const result = StixToUnfetterAdapater.stixToUnfetterStix(mockIngest[0]);
            
            expect(result._id).toBe('1234');
            expect(result.extendedProperties.x_fake_prop).toBe('fake1');
            expect(Object.keys(result.stix).length).toBe(2);
        });

        it('should convert multiple STIX documents to Unfetter STIX data model using a function reference', () => {
            const results = mockIngest.map(StixToUnfetterAdapater.stixToUnfetterStix);

            expect(results[0]._id).toBe('1234');
            expect(results[0].extendedProperties.x_fake_prop).toBe('fake1');
            expect(Object.keys(results[0].stix).length).toBe(2);

            expect(results[1]._id).toBe('5678');
            expect(results[1].extendedProperties.x_fake_prop).toBe('fake2');
            expect(Object.keys(results[1].stix).length).toBe(2);
        });
    });
});
