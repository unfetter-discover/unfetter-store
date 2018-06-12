import * as fs from 'fs';
import * as path from 'path';

import { ConfigModel } from './configModel';

let tempConfig: ConfigModel = null;

// TODO remove handling for legacy path
const currentPath = path.join(__dirname, '..', '..', 'config', 'private', 'private-config.json');
const legacyPath = path.join(__dirname, '..', '..', 'config', 'private-config.json');

if (fs.existsSync(currentPath)) {
    tempConfig = JSON.parse(fs.readFileSync(currentPath, 'utf8'));
} else if (fs.existsSync(legacyPath)) {
    tempConfig = JSON.parse(fs.readFileSync(legacyPath, 'utf8'));
    console.log('WARNING: You are using a legacy version of the of the configuration file, please rerun the unfetter-store/unfetter-utils/api_configuration_tool.py script');
} else {
    console.error('Please use unfetter-store/unfetter-utils/api_configuration_tool.py to create private-config.json');
    process.exit(1);
}

export const CONFIG = tempConfig;
