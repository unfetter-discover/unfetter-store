const https = require('https');
const url = require('url');
const fs = require('fs');
const Strategy = require('passport-strategy');
const AuthHelper = require('../helpers/auth_helpers').AuthHelper;

/**
 * The "Greybox" Strategy targets the GIGEARTH project's GREYBOX project, which simulates IC ITE services, using mock test data to service API
 * endpoints. To use this service, you will need to configure the strategy (there are no defaults). Your API config file would need the following:
 *       ...
 *       "greybox": {
 *           "target": "production | test",
 *           "productionURL": "https://localhost:3000/casport-v4/api/entities/{dn}?specification=NSA&abbreviate=true",
 *           "testURL": "https://localhost:3000/casport-v4/api/entities/{dn}?specification=NSA&abbreviate=true",
 *           "cert": "/etc/pki/tls/certs/server.crt",
 *           "key": "/etc/pki/tls/certs/server.key",
 *           "errors": [403, 404]
 *       }
 *       ...
 * The format of the URLs should obviously change based on the actual authentication service you are using. The ones above point to a locally-running
 * Greybox instance, which should not be used for a live system.
 */
class GreyboxStrategy extends Strategy {

    constructor(config, env, verify) {
        super();
        this.name = 'greybox';
        this.config = config;
        this.env = env;
        this.key = config.key;
        this.cert = config.cert;
        this.callback = verify;
        this.callbackURL = `${config.apiRoot}auth/greybox-callback`;
    }

    authenticate(req, options) {
        const self = this;
        // Request must contain the user's DN
        const dn = req.get('X-Proxied-Entities-Chain');
        if (!dn) {
            return self.fail('No user certificate found');
        }

        function getValue(json, path, defaultValue = undefined) {
            let value = [...path].reduce((obj, p) => ((obj && obj[p]) ? obj[p] : undefined), { ...json });
            if (value && value.value) {
                value = value.value;
            }
            return value || defaultValue;
        }

        try {
            const href = self.config[`${self.config.target}URL`].replace('{dn}', dn);
            const rurl = new url.parse(href);
            const request = https.request({
                host: rurl.hostname,
                port: rurl.port,
                path: rurl.path,
                cert: fs.readFileSync(self.cert),
                key: fs.readFileSync(self.key),
            }, response => {
                let data = '';
                response
                    .on('data', chunk => { data += chunk; })
                    .on('end', () => {
                        const json = JSON.parse(data);
                        if (response.statusCode !== 200) {
                            self.error(getValue(json, ['ErrorMessage', 'message']) || response.statusMessage);
                            return;
                        }
                        const user = {
                            dn,
                            uuid: getValue(json.Entity, 'uuid'),
                            id: getValue(json.Entity, ['Info', 'employeeId']),
                            userName: getValue(json.Entity, ['Info', 'uid']),
                            firstName: getValue(json.Entity, ['Info', 'firstName']),
                            lastName: getValue(json.Entity, ['Info', 'lastName']),
                            emailAddress: getValue(json.Entity, ['Info', 'emailAddresses']),
                            accesses: []
                                .concat((getValue(json.Entity, ['Info', 'clearances'], [])).map(c => c.value))
                                .concat(getValue(json.Entity, ['Info', 'fineAccessControls'], []).map(c => c.value))
                                .concat(getValue(json.Entity, ['Info', 'briefings'], []).map(c => c.value))
                                .concat(getValue(json.Entity, ['Info', 'lacs'], []).map(c => c.value))
                                .concat(getValue(json.Entity, ['Info', 'cois'], []).map(c => c.value))
                                .concat(getValue(json.Entity, ['Info', 'visas'], []).map(c => c.value))
                                .concat(getValue(json.Entity, ['Info', 'dissemControls'], []).map(c => c.value))
                        };
                        options.assignProperty = 'user';
                        options.successRedirect = self.callbackURL;
                        self.success(user);
                    });
            });
            request.setHeader('accept', 'application/json');
            request.on('error', err => {
                self.error(err);
            });
            request.end();
        } catch (err) {
            return self.error(err);
        }
    }

}

/**
 * Attempts to authorize a user against a PKI-certificate-based authentication service REST endpoint. The endpoint should return either a user
 * profile, or a configurable error code (default 404) if authentication fails.
 */
class GreyboxAuth extends AuthHelper {

    constructor() {
        super('greybox');
        this.redirects = true;
    }

    build(config, env) {
        return new GreyboxStrategy(config.greybox, env, (profile, callback) => callback(null, profile));
    }

    search(user) {
        return { 'auth.service': 'greybox', 'auth.id': user.id };
    }

    sync(data, greyboxInfo, approved) {
        super.sync(data, greyboxInfo, approved);

        const user = data;

        user.auth.service = 'greybox';
        user.auth.userName = greyboxInfo.userName;
        user.auth.marking_refs = greyboxInfo.accesses.map(access => `marking-definition--${access}`);

        // setting these breaks registration because it then says "I already have a user by this name".
        // The registration process needs to check if the username/email address is available TO THE ASKING USER.
        // user.userName = greyboxInfo.userName;
        user.firstName = greyboxInfo.firstName;
        user.lastName = greyboxInfo.lastName;
        // user.email = greyboxInfo.emailAddress;

        // user.identity = {
        //     type: 'identity',
        //     identity_class: 'individual',
        //     contact_information: greyboxInfo.emailAddress,
        //     name: `${greyboxInfo.firstName} ${greyboxInfo.lastName}`
        // };
    }

}

(() => new GreyboxAuth())();
