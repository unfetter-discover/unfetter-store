process.env.RUN_MODE = process.env.RUN_MODE || 'DEMO';
const mongoinit = require('./mongoinit.js');
const serverinit = require('./serverinit.js');

global.unfetter = global.unfetter || {};

async function startServices() {
  try {
    const mongoMsg = await mongoinit();
    console.log(mongoMsg);
    const serverMsg = await serverinit();
    console.log(serverMsg);
  } catch (error) {
    console.log('Unable to start API: ', error);
    process.exit(1);
  }  
}

startServices();
