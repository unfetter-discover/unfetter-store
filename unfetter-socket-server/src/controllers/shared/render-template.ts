import { registerPartial, compile } from 'handlebars';
import { readFileSync, } from 'fs';
import { join } from 'path';

import { UserRegisteredData } from '../../models/template-data/user-registered';
import { Constance } from '../../models/constance';

const TEMPLATES_PATH = join(__dirname, '..', '..', '..', 'templates');

// ~~~ Handlebars Partials ~~~
const USER_REGISTERED_PATH = join(TEMPLATES_PATH, 'user-registered.hbs');
const USER_REGISTERED_CONTENT = readFileSync(USER_REGISTERED_PATH, 'utf8');

// ~~~ Handlebars Layout ~~~
const LAYOUT_PATH = join(TEMPLATES_PATH, 'layouts', 'layout.hbs');
const LAYOUT_CONTENT = readFileSync(LAYOUT_PATH, 'utf8');

export function renderUserRegistered(data: UserRegisteredData) {
    registerPartial('body', USER_REGISTERED_CONTENT);
    const compiledTemplate = compile(LAYOUT_CONTENT);
    return compiledTemplate({ ...data, link: Constance.links.uiUrl + Constance.links.approveUsers });
}
