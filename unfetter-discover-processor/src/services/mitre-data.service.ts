interface MitreStixUrls {
    enterprise: string;
    pre: string;
    mobile: string;
}

type MiteStixUrlTypes = keyof MitreStixUrls;

const MITRE_STIX_URLS: MitreStixUrls = {
    enterprise: 'https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json',
    pre: 'https://raw.githubusercontent.com/mitre/cti/master/pre-attack/pre-attack.json',
    mobile: 'https://raw.githubusercontent.com/mitre/cti/master/mobile-attack/mobile-attack.json'
};

import * as HttpsProxyAgent from 'https-proxy-agent';
import fetch from 'node-fetch';
import * as url from 'url';

function mitreFetch(mitreUrl: string, instanceOptions: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
        fetch(mitreUrl, instanceOptions)
            .then((fetchRes) => fetchRes.json())
            .then((fetchRes) => {
                const stixToUpload = fetchRes.objects
                    .map((stix: any) => {
                        const retVal: any = {
                            _id: stix.id,
                            stix: {}
                        };
                        for (const prop in stix) {
                            if (prop.match(/^x_/) !== null) {
                                if (retVal.extendedProperties === undefined) {
                                    retVal.extendedProperties = {};
                                }
                                retVal.extendedProperties[prop] = stix[prop];
                            } else {
                                retVal.stix[prop] = stix[prop];
                            }
                        }
                        return retVal;
                    });
                resolve(stixToUpload);
            })
            .catch((err) => reject(err));
    });
}

export default function getMitreData(frameworks: string[]): Promise<any> {
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

    const promisesArr: [Promise<any>] | any = [];
    frameworks.forEach((framework: MiteStixUrlTypes) => promisesArr.push(mitreFetch(MITRE_STIX_URLS[framework], instanceOptions)));
    return new Promise((resolve, reject) => {
        Promise.all(promisesArr)
            .then((stixToUploadArr) => resolve(stixToUploadArr.reduce((prev: any[], cur: any) => prev.concat(cur), [])))
            .catch((err) => reject(err));
    });
}
