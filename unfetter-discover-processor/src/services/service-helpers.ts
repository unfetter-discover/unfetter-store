const taxiiAccept = process.env.TAXII_ACCEPT || 'application/vnd.oasis.taxii+json';
const taxiiContentType = process.env.TAXII_CONTENT_TYPE || 'application/vnd.oasis.taxii+json; charset=utf-8; version=2.0';

import * as url from 'url';
import * as HttpsProxyAgent from 'https-proxy-agent';

/**
 * @type {object}
 * @description Holds https proxy options
 */
const instanceOptions: any = {};

if (process.env.HTTPS_PROXY_URL && process.env.HTTPS_PROXY_URL !== '') {
    console.log('Attempting to configure proxy');
    const proxy: any = url.parse(process.env.HTTPS_PROXY_URL);
    // Workaround for UNABLE_TO_GET_ISSUER_CERT_LOCALLY fetch error due to proxy + self-signed cert
    proxy.rejectUnauthorized = false;
    instanceOptions.agent = new HttpsProxyAgent(proxy);
} else {
    console.log('Not using a proxy');
}

/**
 * @type {object}
 * @description Headers to hit TAXII server
 */
const taxiiHeaders: object = {
    Accept: taxiiAccept,
    'Content-Type': taxiiContentType
}

const ServiceHelpers = {
    instanceOptions,
    taxiiHeaders
};

export default ServiceHelpers;
