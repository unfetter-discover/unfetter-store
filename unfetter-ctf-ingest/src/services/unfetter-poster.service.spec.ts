import { JsonSchema } from '../models/json-schema';
import { UnfetterPosterService } from './unfetter-poster.service';

describe('Unfetter poster service', () => {

    let unfetterPosterService: UnfetterPosterService;

    beforeEach(() => {
        unfetterPosterService = new UnfetterPosterService();
    });

    it('should have a constructor', () => {
        expect(unfetterPosterService).toBeDefined();
    });

    it('should call the API', async () => {
        const spy = spyOn(unfetterPosterService, 'uploadJsonSchema');
        spy.and.returnValue([ Promise.resolve(1), Promise.resolve(2) ]);

        const json = [ new JsonSchema() ];
        const promise = unfetterPosterService.uploadJsonSchema(json);
        expect(promise).toBeDefined();
        const arr = await promise;
        expect(arr.length).toEqual(2);
    });

    it('should handle empty params', async () => {
        const spy = spyOn(unfetterPosterService, 'uploadJsonSchema');
        spy.and.returnValue([ Promise.resolve(1), Promise.resolve(2) ]);

        const promise = unfetterPosterService.uploadJsonSchema();
        expect(promise).toBeDefined();
        const arr = await promise;
        expect(arr.length).toEqual(2);
    });
});
