import { writeFileSync } from 'fs';
import { join } from 'path';

import { renderUserRegistered } from '../controllers/shared/render-template';
import { UserRegisteredData } from '../models/template-data/user-registered';

const data: UserRegisteredData = {
    firstName: 'test',
    lastName: 'user',
    email: 'test@test.com'
};

const outfile = join(__dirname, 'user-registered-test.html');

const rendered = renderUserRegistered(data);

writeFileSync(outfile, rendered, 'utf8');

console.log(`Template successfully rendered and saved to ${outfile}.`);
