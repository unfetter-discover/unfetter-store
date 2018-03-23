process.env.RUN_MODE = 'TEST';

const should = require('should');
const request = require('supertest');
const server = require('../../../app');

const controller =
    {
        endpoint: 'x-unfetter-capabilities',
        type: 'x-unfetter-capability',
        attributes: {
            created_by_ref: 'string',
            name: 'Symantec Antivirus Corporate Edition',
            description: 'Anti virus software',
            version: 10.2,
            category: 'Antivirus',
            external_references: []
        }
    };

const stixObj = {};
stixObj.type = controller.type;
stixObj.attributes = controller.attributes;
if (controller.id) {
    stixObj.id = controller.id;
}

// Add (POST)
describe(`POST /${controller.type}`, () => {
    it(`should create an ${controller.type}`, done => {
        request(server)
            .post(`/${controller.endpoint}`)
            .send({ data: stixObj })
            // .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
            .expect(201)
            .end((err, res) => {
                should.not.exist(err);
                should.equal(false, res.error, 'Error found');
                should.exist(res.body.data, `No ${controller.endpoint} created`);
                controller.testId = res.body.data[0].id;
                done();
            });
    });
});

// Get by id
describe(`GET /${controller.endpoint}/{id}`, () => {
    it(`should return the ${controller.endpoint} matching the id in the path`, done => {
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

// Patch / (update) by id   todo: should this also check to make sure the modified date updated?
describe(`PATCH /${controller.endpoint}/{id}`, () => {
    it(`should update a ${controller.endpoint}`, done => {
        request(server)
            .patch(`/${controller.endpoint}/${controller.testId}`)
            .send({
                data: {
                    attributes: {
                        created_by_ref: 'TEST',
                        revoked: false,
                        labels: [],
                        external_references: [],
                        object_marking_refs: [],
                        granular_markings: [],
                        description: 'THIS DESCRIPTION',
                        name: 'TEST NAME',
                        version: 1.0,
                        category: 'TEST'
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


// Delete
describe(`DELETE /${controller.endpoint}/{id}`, () => {
    it(`should delete a ${controller.endpoint}`, done => {
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


// Get all
xdescribe(`GET /${controller.type}`, () => {
    it('Returns arrays of objects assessed.', done => {
        request(server)
            .get(`/${controller.endpoint}`)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end((err, res) => {
                should.not.exist(err);
                should.equal(false, res.error, 'Error found');
                should.exist(res.body.data, 'No "data" found');
                should.equal(res.body.data.length, 3, 'Wrong number of objects were returned.  Expected XXX, received ' + res.body.data.length);
                done();
            });
    });
});
