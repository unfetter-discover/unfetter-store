import * as fs from 'fs';
import * as path from 'path';

import { ConfigModel } from './configModel';

export const CONFIG: ConfigModel = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config/private/private-config.json'), 'utf8'));
