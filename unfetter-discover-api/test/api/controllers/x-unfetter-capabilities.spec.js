process.env.RUN_MODE = 'TEST';

const should = require('should');
const request = require('supertest');
const server = require('../../../app');

// Controllers
const attackPattern = require('./examples/attack_pattern');
const campaign = require('./examples/campaign');
const capability = require('./examples/capability');
const courseOfAction = require('./examples/course_of_action');
const identity = require('./examples/identity');
const indicator = require('./examples/indicator');
const intrusionSet = require('./examples/intrusion_set');
const malware = require('./examples/malware');
const markingDefinition = require('./examples/marking_definition');
const observedData = require('./examples/observed_data');
const relationship = require('./examples/relationship');
const report = require('./examples/report');
const sensor = require('./examples/sensor');
const sighting = require('./examples/sighting');
const threatActor = require('./examples/threat_actor');
const tool = require('./examples/tool');
const xUnfetterAssessment = require('./examples/x_unfetter_assessment');

const xUnfetterObjectAssessment = require('./examples/x_unfetter_object_assessment');
const xUnfetterAssessmentGroup = require('./examples/x_unfetter_assessment_group');
const xUnfetterAssessmentSet = require('./examples/x_unfetter_assessment_set');


const controllers = [
    attackPattern,
    campaign,
    capability,
    courseOfAction,
    identity,
    indicator,
    intrusionSet,
    malware,
    markingDefinition,
    observedData,
    relationship,
    report,
    sensor,
    sighting,
    threatActor,
    tool,
    xUnfetterAssessment,
    xUnfetterObjectAssessment,
    xUnfetterAssessmentGroup,
    xUnfetterAssessmentSet
];

describe('stix controllers', () => {
    for (let controller of controllers) {
        describe(controller.type, () => {
            // Create
            describe(`POST /${controller.type}`, () => {
                it(`should create an ${controller.type}`, done => {
                    let stixObj = {};
                    stixObj.type = controller.type;
                    stixObj.attributes = controller.attributes;
                    if (controller.id) {
                        stixObj.id = controller.id;
                    }
                    request(server)
                        .post(`/${controller.endpoint}`)
                        .send({data:stixObj})
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        // TODO determine appropiate status code(s) to check for
                        // .expect(201)
                        .end((err, res) => {
                            should.not.exist(err);
                            should.equal(false, res.error, 'Error found');
                            should.exist(res.body.data, `No ${controller.endpoint} created`);
                            controller.testId = res.body.data[0].id;
                            done();
                        });
                });
            });

            // update
            describe(`PATCH /${controller.endpoint}/{id}`, () => {
                it(`should update a ${controller.endpoint}`, done => {
                    request(server)
                        .patch(`/${controller.endpoint}/${controller.testId}`)
                        .send({
                            data: {
                                attributes: {
                                    revoked: true
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
                it(`should return all ${controller.endpoint}`, done => {
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
                it(`should return the ${controller.endpoint} matching the id in the path`, done => {
                    request(server)
                        .get(`/${controller.endpoint}/${controller.testId}`)
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        .expect(200)
                        .end((err, res) => {
                            should.not.exist(err);
                            should.equal(false, res.error, 'Error found');
                            should.exist(res.body.data.attributes.x_extended_property_test);
                            should(typeof res.body.data).equal('object', `There should be exactly 1 ${controller.endpoint} returned.`);
                            done();
                            console.log(res.body.data);
                        });
                });
            });

            // get by id without extended properties
            describe(`GET /${controller.endpoint}/{id}?extendedproperties=false`, () => {
                it(`should return the ${controller.endpoint} matching the id in the path without extended properties`, done => {
                    request(server)
                        .get(`/${controller.endpoint}/${controller.testId}?extendedproperties=false`)
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        .expect(200)
                        .end((err, res) => {
                            should.not.exist(err);
                            should.not.exist(res.body.data.attributes.x_extended_property_test);
                            should(typeof res.body.data).equal('object', `There should be exactly 1 ${controller.endpoint} returned.`);
                            done();
                        });
                });
            });

            // get with filter
            describe(`GET /${controller.endpoint}?filter=filterstring`, () => {
                it(`should filter ${controller.endpoint} created > 1980`, done => {
                    const filter = encodeURIComponent(JSON.stringify({
                        "stix.created": {
                            "$gte": "1980-01-01T00:00:00.000Z"
                        }
                    }));
                    request(server)
                        .get(`/${controller.endpoint}?filter=${filter}`)
                        .expect('Content-Type', 'application/vnd.api+json; charset=utf-8')
                        .expect(200)
                        .end((err, res) => {
                            should.not.exist(err);
                            should.equal(false, res.error, 'Error found');
                            should(res.body.data.length).be.above(0, `No '${controller.endpoint}' found`);
                            // should.equal(res.body.data.length, 2, 'There should be exactly 2 attack patterns returned.');
                            done();
                        });
                });
            });

            // get with sort
            describe(`GET /${controller.endpoint}?sort=sortstring`, () => {
                it(`should sort all ${controller.endpoint} in descending order by created date`, done => {
                    const sort = encodeURIComponent(JSON.stringify({
                        created: -1
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
                it(`should get the oldest ${controller.endpoint}, using created sort and limit 1`, done => {
                    const sort = encodeURIComponent(JSON.stringify({
                        created: -1
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
                it(`should get ${controller.endpoint} using sort, limit, and skip`, done => {
                    const sort = encodeURIComponent(JSON.stringify({
                        created: -1
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
                it('should return a 404 since the id doesn\'t exist', done => {
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
        }); // End controller test
    } // End controllers for loop
}); // End stix controllers test

