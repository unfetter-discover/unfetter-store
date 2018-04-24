const fetch = require('node-fetch');
const ipregex = require('ip-regex');

/**
 * Uses the Builder pattern.
 */
class RequestError {

    static create() {
        let re = new RequestError();
        re.err = {
            status: 500,
            source: '',
            title: '',
            errors: []
        };
        return re;
    }

    addError(code = '', message = 'An unknown error has occurred.') {
        this.err.errors.push({
            code: code,
            message: message,
        });
        return this;
    }

    status(status = 500) {
        this.status = status;
        return this;
    }

    source(source = '') {
        this.source = source;
        return this;
    }

    title(title = '') {
        this.title = title;
        return this;
    }

    code(code = '') {
        this.current().code = code;
        return this;
    }

    message(message = '') {
        this.current().message = message;
        return this;
    }

    current() {
        if (this.err.errors.length) {
            return this.err.errors.slice(-1)[0];
        } else {
            return this.addError();
        }
    }

    build() { return this.err }

}

class IPGeoProvider {
    constructor(id, url, active = true, batchSeparator = null) {
        this.id = id;
        this.url = url;
        this.active = active;
        this.batchSeparator = batchSeparator;
        this.setKey = (req) => {};
    }

    withHeaderKey(header, key) {
        this.setKey = (req) => {
            request.headers = {header: header, key: String(key)}
        };
        return this;
    }

    withQueryParamKey(param, key) {
        this.setKey = (req) => {
            req.uri += (req.uri.indexOf('?') > 0) ? '&' : '?';
            req.uri += String(param) + '=' + String(key);
        };
        return this;
    }
}

/*
 * TODO Need to find a way to add this information to the system configuration (not something a user needs to see).
 *      If we do so, we can also do more to add the optional/required personal keys that some providers require, or
 *      that can be purchased.
 */
const IPGEO_PROVIDERS = [
    // another free service allows up to 1500 requests per day, can be bulk(?)
    new IPGeoProvider('ipdata.co', 'https://api.ipdata.co/*'),

    // free-version service allows up to 1000 requests per day, no bulk queries
    new IPGeoProvider('ipapi.co', 'https://ipapi.co/*/json/'),

    // free-version service allows up to 10,000 requests per MONTH (bah!), can be bulk,
    // and being replaced by newer (still free) service that requires sign-up by 1 July 2018
    new IPGeoProvider('freegeoip', 'https://freegeoip.net/json/*', false),

    // new endpoint for freegeoip with personal key ()
    new IPGeoProvider('ipstack.com', 'http://api.ipstack.com/*', true, ',')
            .withQueryParamKey('access_key', '64a9512c200c1edd5b5b521a441f0eff'),
];

/**
 * @param {IPGeoProvider} provider 
 * @param {String[]} ip IP address to look up
 */
function queryProviders(providers, ip, res, error = RequestError.create()) {
    const provider = providers.shift();
    if (!provider) {
        return res.status(500).json(error.build());
    }

    const request = {
        uri: provider.url.replace('*', ip),
        headers: {
            'Accept': 'application/json',
        },
    }
    provider.setKey(request);

    const timeout = 1000 * 5; // millis
    fetch(request.uri, {
        headers: request.headers,
        method: 'GET',
        timeout
    }).then(response => response
        .json())
        .then(json => {
            return res.status(200).json({success: true, provider: provider.id, ...json});
        })
        .catch(ex => {
            error.addError().code(provider.id).message(ex);
            queryProviders(providers, ip, res, error);
        });
}

const lookup = (req, res) => {
    if (!req || !req.swagger || !req.swagger.params) {
        return res.status(500).json(RequestError.create().addError().build());
    }

    const ip = req.swagger.params.ip;
    if (!ip || !ip.value) {
        return res.status(400).json(RequestError.create().status(400).title('No IP Address Provided')
                .message('You must provide an IP address to locate.').build());
    }
    if (!ipregex().test(ip.value)) {
        return res.status(400).json(RequestError.create().status(400).title('Invalid IP Address Provided')
                .message(`The given value is not a valid IP address: ${ip}`).build());
    }

    const activeProviders = IPGEO_PROVIDERS.filter(provider => provider.active);
    if (activeProviders.length === 0) {
        return res.status(503).json(RequestError.create().status(503).title('No IP-geo providers')
                .message('There are no active providers for geolocation services in our current configuration.  ' +
                        'Please ask administrators to add new providers.').build())
    }

    queryProviders(activeProviders, ip.value, res);
};

module.exports = {
    lookup
};
