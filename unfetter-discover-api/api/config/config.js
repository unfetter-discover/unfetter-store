if (process.env.RUN_MODE === 'UAC') {
    const fs = require('fs');
    const path = require('path');

    const privateConfigLocation = path.join(__dirname, 'private', 'private-config.json');
    let privateConfig;

    if (!fs.existsSync(privateConfigLocation)) {
        // TODO delete this temporary handling for the legacy config location
        const legacyConfigLocation = path.join(__dirname, 'private-config.json');
        if (fs.existsSync(legacyConfigLocation)) {
            privateConfig = JSON.parse(fs.readFileSync(legacyConfigLocation, 'utf8'));
            console.log('WARNING: You are using a legacy version of the of the configuration file, please rerun the unfetter-store/unfetter-utils/api_configuration_tool.py script');
        } else {
            console.error('Please use unfetter-store/unfetter-utils/api_configuration_tool.py to create private-config.json');
            process.exit(1);
        }
    } else {
        privateConfig = JSON.parse(fs.readFileSync(privateConfigLocation, 'utf8'));
    }

    module.exports = privateConfig;
} else {
    module.exports = {};
}
