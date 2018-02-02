import { writeFileSync } from 'fs';
import { join } from 'path';

import { renderUserRegistered } from '../controllers/shared/render-template';
import { UserRegisteredData } from '../models/template-data/user-registered';

const data: UserRegisteredData = {
    firstName: 'test',
    lastName: 'user',
    email: 'test@test.com'
};

const rendered = renderUserRegistered(data);

const path = join(__dirname, 'user-registered-test.html');

writeFileSync(path, rendered, 'utf8');
