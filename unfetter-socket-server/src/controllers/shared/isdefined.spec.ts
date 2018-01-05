import {} from 'jasmine';
import { Request } from 'express';

import { isDefinedJsonApi } from './isdefined';

describe('isdefined object property helper', () => {

    let mockReq: Request | any = {
        body: {
            data: {
                attributes: {
                    notification: { },
                    nested: {
                        path: {
                            item: { }
                        }
                    },
                    another: {
                        path: {
                            item: {}
                        }
                    }
                }
            }
        }
    };

    it('should not find a fake property', () => {

        expect(isDefinedJsonApi(mockReq, ['fakeproperty'])).toBe(false);
    });

    it('should find a single property', () => {

        expect(isDefinedJsonApi(mockReq, ['notification'])).toBe(true);
    });

    it('should find multiple nested properties', () => {

        expect(isDefinedJsonApi(mockReq, ['nested', 'path', 'item'], ['another', 'path', 'item'])).toBe(true);
    });
});
