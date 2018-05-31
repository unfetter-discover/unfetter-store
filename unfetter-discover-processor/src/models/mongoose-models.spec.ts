import MongooseModels from './mongoose-models';

describe('MongooseModels', () => {

    it('should validate stixModel', (done) => {
        const fakemodel = new MongooseModels.stixModel({
            _id: '1234',
            created: '2018-04-20T19:28:12.162Z',
            published: '2018-04-20T19:28:12.162Z'
        });
        fakemodel.validate()
            .then((errors: any[]) => {
                expect(errors).toBeFalsy();
                done();
            })
            .catch((err: any) => {
                console.log(err);
                done();
            });
    });

    it('should validate configModel', (done) => {
        const fakemodel = new MongooseModels.configModel({
            _id: '1234',
            configKey: 'test',
            configValue: 'test'
        });
        fakemodel.validate()
            .then((errors: any[]) => {
                expect(errors).toBeFalsy();
                done();
            })
            .catch((err: any) => {
                console.log(err);
                done();
            });
    });

    it('should validate utilModel', (done) => {
        const fakemodel = new MongooseModels.utilModel({
            _id: '1234',
            utilityName: 'test',
            utilityValue: 'test'
        });
        fakemodel.validate()
            .then((errors: any[]) => {
                expect(errors).toBeFalsy();
                done();
            })
            .catch((err: any) => {
                console.log(err);
                done();
            });
    });
});
