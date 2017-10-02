const should = require('should');
const request = require('supertest');
const server = require('../../../app');
const mongoinit = require('../../../api/server/mongoinit')();

const controller = {
    endpoint: 'config',
    attributes: {
        "configKey": "test key",
        "configValue": "test value",
        "configGroups": [
            "testing"
        ]
    }
};

describe('config controllers', () => {

    describe(controller.type, () => {
        // Create
        describe(`POST /${controller.endpoint}`, () => {
            it(`should create an ${controller.endpoint}`, (done) => {

                let postObj = {};
                postObj.attributes = controller.attributes;

                request(server)
                    .post(`/${controller.endpoint}`)
                    .send({ data: postObj })
                    .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                    // TODO determine appropiate status code(s) to check for
                    // .expect(201)
                    .end((err, res) => {
                        should.not.exist(err);
                        should.equal(false, res.error, 'Error found');
                        should.exist(res.body.data, `No ${controller.endpoint} created`);
                        controller.testId = res.body.data.attributes._id;
                        done();
                    });
            });
        });

        // update
        describe(`PATCH /${controller.endpoint}/{id}`, () => {
            it(`should update a ${controller.endpoint}`, (done) => {
                request(server)
                    .patch(`/${controller.endpoint}/${controller.testId}`)
                    .send({
                        data: {
                            attributes: {
                                configValue: 'new test value'
                            }
                        }
                    })
                    .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                    .expect(200)
                    .end((err, res) => {
                        should.not.exist(err);
                        should.equal(false, res.error, 'Error found');
                        should.exist(res.body.data, `No ${controller.endpoint} updated`);
                        done();
                    });
            });
        });

        // get all
        describe(`GET /${controller.endpoint}`, () => {
            it(`should return all ${controller.endpoint}`, (done) => {
                request(server)
                    .get(`/${controller.endpoint}`)
                    .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                    .expect(200)
                    .end((err, res) => {
                        should.not.exist(err);
                        should.equal(false, res.error, 'Error found');
                        should(res.body.data.length).be.above(0, `No '${controller.endpoint}' found`);
                        done();
                    });
            });
        });

        // get by id
        describe(`GET /${controller.endpoint}/{id}`, () => {
            it(`should return the ${controller.endpoint} matching the id in the path`, (done) => {
                request(server)
                    .get(`/${controller.endpoint}/${controller.testId}`)
                    .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                    .expect(200)
                    .end((err, res) => {
                        should.not.exist(err);
                        should.equal(false, res.error, 'Error found');
                        should(typeof res.body.data).equal('object', `There should be exactly 1 ${controller.endpoint} returned.`);
                        done();
                    });
            });
        });

        // TODO get with filter

        // get with sort
        describe(`GET /${controller.endpoint}?sort=sortstring`, () => {
            it(`should sort all ${controller.endpoint} in descending order by created date`, (done) => {
                const sort = encodeURIComponent(JSON.stringify({
                    configKey: -1
                }));
                request(server)
                    .get(`/${controller.endpoint}?sort=${sort}`)
                    .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                    .expect(200)
                    .end((err, res) => {
                        should.not.exist(err);
                        should.equal(false, res.error, 'Error found');
                        should(res.body.data.length).be.above(0, `No '${controller.endpoint}' found`);
                        done();
                    });
            });
        });

        // get with sort and limit
        describe(`GET /${controller.endpoint}?sort=sortstring&limit=limitvalue`, () => {
            it(`should get the oldest ${controller.endpoint}, using created sort and limit 1`, (done) => {
                const sort = encodeURIComponent(JSON.stringify({
                    configKey: -1
                }));
                const limit = encodeURIComponent(1);
                request(server)
                    .get(`/${controller.endpoint}?sort=${sort}&limit=${limit}`)
                    .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                    .expect(200)
                    .end((err, res) => {
                        should.not.exist(err);
                        should.equal(false, res.error, 'Error found');
                        should.equal(res.body.data.length, 1, `There should be exactly 1 ${controller.endpoint} returned.`);
                        done();
                    });
            });
        });

        // get with sort, limit, and skip
        describe(`GET /${controller.endpoint}?sort=sortstring&limit=limitvalue&skip=skipvalue`, () => {
            it(`should get ${controller.endpoint} using sort, limit, and skip`, (done) => {
                const sort = encodeURIComponent(JSON.stringify({
                    configKey: -1
                }));
                const limit = encodeURIComponent(1);
                const skip = encodeURIComponent(0);
                request(server)
                    .get(`/${controller.endpoint}?sort=${sort}&limit=${limit}&skip=${skip}`)
                    .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                    .expect(200)
                    .end((err, res) => {
                        should.not.exist(err);
                        should.equal(false, res.error, 'Error found');
                        should.equal(res.body.data.length, 1, `There should be exactly 1 ${controller.endpoint} returned.`);
                        done();
                    });
            });
        });

        // get by id that doesn't exist
        describe(`GET /${controller.endpoint}/{id} - id does not exist`, () => {
            it('should return a 404 since the id doesn\'t exist', (done) => {
                const id = 'noidtomatch';
                request(server)
                    .get(`/${controller.endpoint}/${id}`)
                    .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                    .expect(404)
                    .end((err, res) => {
                        should.not.exist(err);
                        should.exist(res.body.message, 'There is no error message.');
                        done();
                    });
            });
        });

        // delete
        describe(`DELETE /${controller.endpoint}/{id}`, () => {
            it(`should delete a ${controller.endpoint}`, (done) => {
                request(server)
                    .delete(`/${controller.endpoint}/${controller.testId}`)
                    .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                    .expect(200)
                    .end((errDelete, resDelete) => {
                        should.not.exist(errDelete);
                        should.equal(false, resDelete.error, 'Error found');
                        should.exist(resDelete.body.data, `No '${controller.endpoint}' deleted`);
                        done();
                    });
            });
        });

    }); // End controller test 
}); // End stix controllers test