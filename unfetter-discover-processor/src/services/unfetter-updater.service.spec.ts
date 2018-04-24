import UnfetterUpdaterService from './unfetter-updater.service';
import MongooseModels from '../models/mongoose-models';

describe('UnfetterUpdaterService', () => {

    // beforeEach(() => {
    //     const mockStixModel = {
    //         findByIdAndUpdate: () => {
    //             console.log(')(#I(I#% IN MOCK');
    //             return {};
    //         },
    //         exec: () => {
    //             console.log('IJIJ MOCK');
    //             return Promise.resolve(true);
    //         },
    //         find: () => {
    //             console.log('IN FIND');
    //         }
    //     }
    //     spyOn(MongooseModels.stixModel, 'findByIdAndUpdate').and.returnValue({});
    //     // spyOn(MongooseModels.stixModel, 'exec').and.returnValue(mockStixModel.exec);
    //     spyOn(MongooseModels.stixModel, 'find').and.returnValue([]);
    //     // console.log(Object.keys(MongooseModels.stixModel));
    // });

    // describe('generateUpdates', () => {
    //     const now = new Date();
    //     it('should return IDs matching updates', async (done) => {
    //         const mockStix = [
    //             {
    //                 _id: '1234',
    //                 extendedProperties: {
    //                     foo: 'bar'
    //                 }
    //             },
    //             {
    //                 _id: '5678',
    //                 metaProperties: {
    //                     foo: 'bar'
    //                 }
    //             }
    //         ];
    //         const res = await UnfetterUpdaterService.generateUpdates(mockStix);
    //         console.log('$$$$', res);
    //         done();
    //     });
    // });

    describe('removeUpdateDocs', () => {
        it('should remove docs tagged for update', () => {
            const mockStix = [
                { _id: '12' },
                { _id: '34' },          
                { _id: '56' },          
                { _id: '78' },          
                { _id: '90' }          
            ];
            const mockUpdateIds = [ '34', '78' ];
            UnfetterUpdaterService.removeUpdateDocs(mockStix, mockUpdateIds);
            expect(mockStix.length).toBe(3);
            const idString = mockStix
                .map((s) => s._id)
                .join('');
            expect(idString).toBe('125690');
        });        
    });
});
