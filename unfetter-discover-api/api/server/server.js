process.env.RUN_MODE = process.env.RUN_MODE || 'DEMO';
const mongoinit = require('./mongoinit.js');
const serverinit = require('./serverinit.js');

const err =
  (errMsg) => {
    console.log('Failed to start http server, giving up', errMsg);
  };

global.unfetter = global.unfetter || {};

mongoinit()
  .then(async () => {
    console.log('connected to mongodb, starting api http server...');
    await serverinit().catch(err);
  }).catch(err);
