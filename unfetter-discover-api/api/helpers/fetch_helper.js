const HttpsProxyAgent = require('https-proxy-agent');
const url = require('url');
const concat = require('concat-stream');

const instanceOptions = {};

// HTTP proxy
if (process.env.HTTPS_PROXY_URL && process.env.HTTPS_PROXY_URL !== '') {
    console.log('Attempting to configure proxy');
    const proxy = url.parse(process.env.HTTPS_PROXY_URL);
    // Workaround for UNABLE_TO_GET_ISSUER_CERT_LOCALLY fetch error due to proxy + self-signed cert
    proxy.rejectUnauthorized = false;
    instanceOptions.agent = new HttpsProxyAgent(proxy);
} else {
    console.log('Not using a proxy');
}

const getResultBuffer = fetchResults => new Promise((resolve, reject) => {
    fetchResults.body.pipe(
        concat({ encoding: 'buffer' }, data => resolve(data))
    );
});

module.exports = {
    instanceOptions,
    getResultBuffer
};
