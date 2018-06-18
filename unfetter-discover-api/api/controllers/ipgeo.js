const fetch = require('node-fetch');
const ipregex = require('ip-regex');
const IPGEO_PROVIDERS = require('../config/ipgeo-config').IPGEO_PROVIDERS;

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
        return re;
    }

    status(status) {
        this.err.status = status;
        return this;
    }

    title(title = '') {
        this.err.title = title;
        return this;
    }

    addError(source = undefined, code = undefined, message = 'An unknown error has occurred.') {
        this.err.errors.push({ code, source, message, });
        return this;
    }

    code(code = '') {
        this.current().code = code;
        return this;
    }

    source(source) {
        this.current().source = source;
        return this;
    }

    message(message = '') {
        this.current().message = message;
        return this;
    }

    current() {
        if (!this.err.errors.length) {
            this.addError();
        }
        return this.err.errors[this.err.errors.length - 1];
    }

    build() {
        return this.err;
    }

}

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
        .then(json => res.status(200).json({ data: { success: true, provider: provider.id, ...json } }))
        .catch(ex => {
            error.addError().source(provider.id).message(ex);
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
            .message('You must provide an IP address to locate.')
            .build());
    }
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
