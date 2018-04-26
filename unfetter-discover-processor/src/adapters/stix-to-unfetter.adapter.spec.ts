import StixToUnfetterAdapater from './stix-to-unfetter.adapter';
import TestHelpers from '../testing/test-helpers';

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
});
