const should = require('should');
const request = require('supertest');
const server = require('../../../app');

// describe('controllers', () => {
//   describe('downloads', () => {
//     describe('GET /downloadBundle', () => {
//       it('should return a stix bundle', (done) => {
//         request(server)
//           .get('/downloadBundle')
//           .set('Accept', 'application/json')
//           .expect('Content-Type', /json/)
//           .expect(200)
//           .end((err, res) => {
//             should.not.exist(err);
//             should.not.exist(res.error, 'Error found');
//             should.exist(res.body.objects, 'No "objects" found');
//             done();
//           });
//       });
//     });
//   });
// });
