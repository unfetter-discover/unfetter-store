import { } from 'jasmine';

import { CreateJsonApiError, CreateJsonApiSuccess } from './jsonapi';

describe('jsonapi model', () => {

    it('should create a success return with a specified property', () => {
        let mockSuccess: any = new CreateJsonApiSuccess({'sample': 123});
        expect(mockSuccess.data.attributes.sample).toBe(123);
    });

    it('should create an error return with specified properties and details', () => {
        let mockError: any = new CreateJsonApiError('500', 'google.com', 'error', '123');
        expect(mockError.errors[0].status).toBe('500');
        expect(mockError.errors[0].title).toBe('error');
        expect(mockError.errors[0].source.pointer).toBe('google.com');
        expect(mockError.errors[0].detail).toBe('123');
    });

    it('should create an error return with specified properties, but without details', () => {
        let mockError: any = new CreateJsonApiError('500', 'google.com', 'error');
        expect(mockError.errors[0].status).toBe('500');
        expect(mockError.errors[0].title).toBe('error');
        expect(mockError.errors[0].source.pointer).toBe('google.com');
        expect(mockError.errors[0].detail).toBeUndefined();
    });
});
