import { registerPartial, compile } from 'handlebars';
import { readFileSync, } from 'fs';
import { join } from 'path';

import { UserRegisteredData } from '../../models/template-data/user-registered';
import { Constance } from '../../models/constance';

const TEMPLATES_PATH = join(__dirname, '..', '..', '..', 'templates');

// ~~~ Handlebars Partials ~~~
const USER_REGISTERED_PATH = join(TEMPLATES_PATH, 'user-registered.hbs');
const USER_REGISTERED_CONTENT = readFileSync(USER_REGISTERED_PATH, 'utf8');

const REGISTRATION_APPROVED_PATH = join(TEMPLATES_PATH, 'registration-approval.hbs');
const REGISTRATION_APPROVED_CONTENT = readFileSync(REGISTRATION_APPROVED_PATH, 'utf8');

const STYLES_PATH = join(TEMPLATES_PATH, 'shared', 'styles.hbs');
const STYLES_CONTENT = readFileSync(STYLES_PATH, 'utf8');
registerPartial('styles', STYLES_CONTENT);

// ~~~ Handlebars Layout ~~~
const LAYOUT_PATH = join(TEMPLATES_PATH, 'layouts', 'layout.hbs');
const LAYOUT_CONTENT = readFileSync(LAYOUT_PATH, 'utf8');

const globalData = {
    ufHomepage: Constance.links.unfetterHomepage,
    ufContact: Constance.links.unfetterContact,
};

export function renderUserRegistered(data: UserRegisteredData) {
    registerPartial('body', USER_REGISTERED_CONTENT);
    const compiledTemplate = compile(LAYOUT_CONTENT);
    return compiledTemplate({ ...globalData, ...data, link: Constance.links.uiUrl + Constance.links.approveUsers });
}

export function renderRegistrationApproval(data: any = {}) {
    registerPartial('body', REGISTRATION_APPROVED_CONTENT);
    const compiledTemplate = compile(LAYOUT_CONTENT);
    return compiledTemplate({ ...globalData, ...data, link: Constance.links.uiUrl });
}
