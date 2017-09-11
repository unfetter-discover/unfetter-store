const should = require('should');
const request = require('supertest');
const server = require('../../../app');

// describe('controllers', () => {
//   describe('dashboards', () => {
//     describe('GET /dashboards/intrusionSetView', () => {
//       it('should return a Intrusion Set view bundle', (done) => {
//         request(server)
//           .get('/dashboards/intrusionSetView')
//           .query({ intrusionSetIds: 'intrusion-set--d08627de-60e3-4f82-859d-31cb25439bcb' })
//           .set('Accept', 'application/json')
//           .expect('Content-Type', /json/)
//           .expect(200)
//           .end((err, res) => {
//             should.not.exist(err);
//             should.not.exist(res.error, 'Error found');
//             should.exist(res.body.data.intrusionSets, 'No "intrusionSets" found');
//             should.exist(res.body.data.killChainPhases, 'No "killChainPhases" found');
//             should.exist(res.body.data.coursesOfAction, 'No "coursesOfAction" found');
//             should.exist(res.body.data.totalAttackPatterns, 'No "totalAttackPatterns" found');
//             should(res.body.data.intrusionSets.length).be.greaterThan(0, 'intrusionSets array is empty');
//             should(res.body.data.killChainPhases.length).be.greaterThan(0, 'killChainPhases array is empty');
//             should(res.body.data.coursesOfAction.length).be.greaterThan(0, 'coursesOfAction array is empty');
//             should(res.body.data.totalAttackPatterns).be.greaterThan(0, 'totalAttackPatterns is 0');
//             done();
//           });
//       });
//     });
//   });
// });
