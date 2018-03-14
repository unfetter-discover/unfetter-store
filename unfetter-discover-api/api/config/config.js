const fs = require('fs');
const path = require('path');

if (process.env.RUN_MODE === 'UAC') {
//    const fs = require('fs');
//    const path = require('path');

    const privateConfigLocation = path.join(__dirname, 'private-config.json');
    let privateConfig;

    if (!fs.existsSync(privateConfigLocation)) {
        console.error('Please use unfetter-store/unfetter-utils/api_configuration_tool.py to create private-config.json');
        process.exit(1);
    } else {
        privateConfig = JSON.parse(fs.readFileSync(privateConfigLocation, 'utf8'));
    }

    module.exports = privateConfig;
} else {
    module.exports = {};
}
