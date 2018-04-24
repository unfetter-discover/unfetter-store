const fetch = require('node-fetch');
const ipregex = require('ip-regex');

/**
 * Uses the Builder pattern.
 */
class RequestError {

    static create() {
        const re = new RequestError();
        re.err = {
            status: 500,
            title: '',
            errors: []
        };
        console.log('created request error object', re);
        return re;
    }

    status(status) {
        this.err.status = status;
        console.log('set status', this);
        return this;
    }

    title(title = '') {
        this.err.title = title;
        console.log('set title', this);
        return this;
    }

    addError(source = undefined, code = undefined, message = 'An unknown error has occurred.') {
        this.err.errors.push({ code, source, message, });
        console.log('added error', this);
        return this;
    }

    code(code = '') {
        this.current().code = code;
        console.log('set code', this);
        return this;
    }

    source(source) {
        this.current().source = source;
        console.log('set source', this);
        return this;
    }

    message(message = '') {
        this.current().message = message;
        console.log('set message', this);
        return this;
    }

    current() {
        if (!this.err.errors.length) {
            this.addError();
        }
        return this.err.errors[this.err.errors.length - 1];
    }

    build() {
        console.log('final', this.err);
        return this.err;
    }

}

class IPGeoProvider {
    constructor(id, url, active = true, batchSeparator = null) {
        this.id = id;
        this.url = url;
        this.active = active;
        this.batchSeparator = batchSeparator;
        this.setKey = req => {};
    }

    withHeaderKey(header, key) {
        this.setKey = req => {
            req.headers = { header, key, };
        };
        return this;
    }

    withQueryParamKey(param, key) {
        this.setKey = req => {
            req.uri = `${req.uri}${(req.uri.indexOf('?') > 0) ? '&' : '?'}${param}=${key}`;
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
            Accept: 'application/json',
        },
    };
    provider.setKey(request);

    const timeout = 1000 * 5; // millis
    fetch(request.uri, {
        headers: request.headers,
        method: 'GET',
        timeout
    }).then(response => response
        .json())
        .then(json => res.status(200).json({ success: true, provider: provider.id, ...json }))
        .catch(ex => {
            error.addError().source(provider.id).message(ex);
            queryProviders(providers, ip, res, error);
        });
}

const lookup = (req, res) => {
    if (!req || !req.swagger || !req.swagger.params) {
        console.log('no req or swagger or params object');
        return res.status(500).json(RequestError.create().addError().build());
    }

    console.log('pulling ip value');
    const ip = req.swagger.params.ip;
    if (!ip || !ip.value) {
        return res.status(400).json(RequestError.create().status(400).title('No IP Address Provided')
            .message('You must provide an IP address to locate.')
            .build());
    }
    console.log('testing ip value', ip.value);
    try {
        if (!ipregex().test(ip.value)) {
            return res.status(400).json(RequestError.create().status(400).title('Invalid IP Address Provided')
                .message(`The given value is not a valid IP address: ${ip.value}`)
                .build());
        }
    } catch (ex) {
        return res.status(500).json(RequestError.create().status(500).title('Error performing IP check')
            .message(`Could not perform IP validation: ${ex}`)
            .build());
    }

    console.log('starting queries');
    const activeProviders = IPGEO_PROVIDERS.filter(provider => provider.active);
    if (activeProviders.length === 0) {
        return res.status(503).json(RequestError.create().status(503).title('No IP-geo providers')
            .message('There are no active providers for geolocation services in our current configuration.  ' +
                    'Please ask administrators to add new providers.')
            .build());
    }

    queryProviders(activeProviders, ip.value, res);
};

module.exports = {
    lookup
};
