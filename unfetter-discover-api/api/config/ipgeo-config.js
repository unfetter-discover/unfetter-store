const IPGeoProvider = require('../models/ipgeo').IPGeoProvider;

/*
 * To override this in a deployment, you will need to copy this file and replace the providers below. This is due to
 * the nature that the providers can provide behavior (functions), and that cannot be overridden in a JSON file.
 */
const IPGEO_PROVIDERS = [
    // another free service allows up to 1500 requests per day, can be bulk(?)
    new IPGeoProvider('ipdata.co', 'https://api.ipdata.co/*')
        .withTranslate(json => ({ ...json, country: json.country_code })),

    // free-version service allows up to 1000 requests per day, no bulk queries
    new IPGeoProvider('ipapi.co', 'https://ipapi.co/*/json/'),

    // new endpoint for freegeoip with personal key ()
    new IPGeoProvider('ipstack.com', 'http://api.ipstack.com/*', true, ',')
        .withQueryParamKey('access_key', '64a9512c200c1edd5b5b521a441f0eff')
        .withTranslate(json => ({ ...json, country: json.country_code })),
];

module.exports = {
    IPGEO_PROVIDERS,
};
