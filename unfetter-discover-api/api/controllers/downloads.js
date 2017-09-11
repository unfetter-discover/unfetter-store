// const fetch = require('node-fetch');
// const lodash = require('lodash');

// const typePathMapping = {
//   attack_patterns: 'attack-patterns',
//   courses_of_action: 'course-of-actions',
//   campaigns: 'campaigns',
//   indicators: 'indicators',
//   identities: 'identities',
//   intrusion_sets: 'intrusion-sets',
//   malware: 'malwares',
//   marking_definitions: 'marking-definitions',
//   observed_data: 'observed-data',
//   relationships: 'relationships',
//   sightings: 'sightings',
//   threat_actors: 'threat-actors',
//   tools: 'tools',
//   reports: 'reports',
//   'x-unfetter-assessment': 'x-unfetter-assessment',
//   'x-unfetter-control-assessments': 'x-unfetter-control-assessments',
//   'x-unfetter-sensors': 'x-unfetter-sensors'
// };

// const downloadBundle = function downloadBundleFunc(req, res) {
//   const baseUrl = `${process.env.STIX_API_PROTOCOL}://${process.env.STIX_API_HOST}:${process.env.STIX_API_PORT}/${process.env.STIX_API_PATH}`;

//   // console.log(`Base URL for the API is : ${baseUrl}`);

//   const promises = [];
//   lodash.forEach(typePathMapping, (key) => {
//     const path = typePathMapping[key];
//     const url = `${baseUrl}/${path}`;
//     promises.push(fetch(url));
//   });

//   Promise.all(promises).then((response) => {
//     const responses = [];
//     for (let i = 0; i < promises.length; i += 1) {
//       responses.push(response[i].json());
//     }
//     Promise.all(responses).then((bundle) => {
//       const objects = [];
//       for (let i = 0; i < responses.length; i += 1) {
//         if (bundle[i].data && bundle[i].data.length > 0) {
//           // unwind jsonapi response so the archive matches the
//           // json files that the processor imports
//           bundle[i].data.forEach((obj) => {
//             const objCopy = obj.attributes;
//             objects.push(objCopy);
//           });
//         }
//       }

//       res.json({ type: 'bundle', id: 'stix-archive-bundle', spec_version: '2.0', objects });
//     })
//       .catch((err) => {
//         res.json({ error: err });
//       });
//   })
//     .catch((err) => {
//       res.json({ error: err });
//     });
// };

// module.exports = {
//   downloadBundle
// };

const model = require('../models/schemaless');

const downloadBundle = function downloadBundleFunc(req, res) {

  model
    .find({'stix':{'$exists':1}})
    .exec((err, results) => {

      if(err) {
        return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
      } else {
        
        let objects = results
          .map(res => res.toObject())
          .map(res => res.stix)
        return res.json({ type: 'bundle', id: 'stix-archive-bundle', spec_version: '2.0', objects });
      }
    });
};

module.exports = {
  downloadBundle
};