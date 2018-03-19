process.env.RUN_MODE = 'TEST';

const should = require('should');
const request = require('supertest');
const server = require('../../../app');

const capabilities = [
    {
        endpoint: 'x-unfetter-capabilities',
        type: 'x-unfetter-capability',
        attributes: {
            'id': 'x-unfetter-capabilities--005fcd1c-7e62-4626-a64e-0674c47d67b6',
            'name': 'Assessment Testing',
            'description': 'Tests an assessment add and deleteById.',
            'version': '2.0'
        }
    },
    {
        endpoint: 'x-unfetter-capabilities',
        type: 'x-unfetter-capability',
        attributes: {
            'id': 'x-unfetter-capability--45256397-a396-40cd-b91a-95f39f99c24a',
            'name': 'Symantec Antivirus Corporate Edition',
            'description': 'Anti virus software',
            'version': '10.2',
            'type' : 'x-unfetter-capability',
            'created_by_ref' : 'identity--test'
        }
    }
];

const capability = capabilities[0];

describe('x-unfetter-capabilities specific routes', () => {
    describe('GET /x-unfetter-capabilities', () => {
        it('Returns all capabilities.', (done) => {
            console.log(`Endpoint is ${capability.endpoint}`);
            request(server)
                .get(`/${capability.endpoint}`)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    should.not.exist(err);
                    should.equal(false, res.error, 'Error found');
                    should.exist(res.body.data, 'No "data" found');
                    should.equal(res.body.data.length, 0, `Wrong number of assessed objects were returned.  Expected 0, received ${res.body.data.length}`);
                    done();
            });
        });
    });

    /*describe(`POST /${capability.type}`, () => {
        it(`should create an ${capability.type}`, (done) => {
            let stixObj = {};
            stixObj.type = capability.type;
            stixObj.attributes = capability.attributes;
            if (capability.id) {
                stixObj.id = capability.id;
            }
            request(server)
                .post(`/${capability.endpoint}`)
                .send({data:stixObj})
                .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                //.expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                // TODO determine appropiate status code(s) to check for
                // .expect(201)
                .end((err, res) => {
                    should.not.exist(err);
                    should.equal(false, res.error, 'Error found');
                    should.exist(res.body.data, `No ${capability.endpoint} created`);
                    capability.testId = res.body.data[0].id;
                    done();
                });
        });
    });

    describe('GET /x-unfetter-capabilities', () => {
        it('Returns all capabilities.', (done) => {
            console.log(`Endpoint is ${capability.endpoint}`);
            request(server)
                .get(`/${capability.endpoint}`)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    should.not.exist(err);
                    should.equal(false, res.error, 'Error found');
                    should.exist(res.body.data, 'No "data" found');
                    should.equal(res.body.data.length, 1, `Wrong number of assessed objects were returned.  Expected 1, received ${res.body.data.length}`);
                    done();
            });
        });
    });

    // get by id
    describe(`GET /${capability.endpoint}/{id}`, () => {
        it(`should return the ${capability.endpoint} matching the id in the path`, (done) => {
            request(server)
                .get(`/${capability.endpoint}/${capability.testId}`)
                .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                .expect(200)
                .end((err, res) => {
                    should.not.exist(err);
                    should.equal(false, res.error, 'Error found');
                    should(typeof res.body.data).equal('object', `There should be exactly 0 ${capability.endpoint} returned.`);
                    done();
                });
        });
    });

    describe('DELETE /x-unfetter-capabilities/{id}', () => {
        it('should delete a x-unfetter-capability', (done) => {
            request(server)
                .delete(`/${capability.endpoint}/${capability.testId}`)
                .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                .expect(200)
                .end((errDelete, resDelete) => {
                    should.not.exist(errDelete);
                    should.equal(false, resDelete.error, 'Error found');
                    should.exist(resDelete.body.data, `No '${capability.endpoint}' deleted`);
                    done();
                });
        });
    });

    describe('GET /x-unfetter-capabilities', () => {
        it('Returns all capabilities.', (done) => {
            console.log(`Endpoint is ${capability.endpoint}`);
            request(server)
                .get(`/${capability.endpoint}`)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end((err, res) => {
                    should.not.exist(err);
                    should.equal(false, res.error, 'Error found');
                    should.exist(res.body.data, 'No "data" found');
                    should.equal(res.body.data.length, 0, `Wrong number of assessed objects were returned.  Expected 0, received ${res.body.data.length}`);
                    done();
            });
        });
    }); */
});
