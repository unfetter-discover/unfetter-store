import fetch from 'node-fetch';

import argv from './cli.service';
import TaxiiClient from '../taxii-client/taxii-client';
import ServiceHelpers from './service-helpers';

/**
 * @param  {string} url
 * @returns Promise
 */
function getRoots(url: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
        fetch(`http://${url}/taxii`, {
            ...ServiceHelpers.instanceOptions,
            headers: ServiceHelpers.taxiiHeaders
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.api_roots) {
                    // Get last part of URL
                    const apiRoots = data.api_roots
                        .map((apiRootUrl: string) => apiRootUrl.split('/').pop());
                    resolve(apiRoots);
                } else {
                    resolve([]);
                }
            })
            .catch((err) => reject(err));
    });
}

/**
 * @param  {string} url
 * @param  {string[]} collections
 * @returns Promise
 */
function getCollections(url: string, root: string): Promise<string[]> {
    return new Promise(async (resolve, reject) => {
        
    });
}

/**
 * @returns Promise
 */
export default function getTaxiiData(): Promise<any> {
    return new Promise(async (resolve, reject) => {
        let taxiiUrl;
        if (argv.taxiiPort) {
            taxiiUrl = `${argv.taxiiHost}:${argv.taxiiPort}`;
        } else {
            taxiiUrl = argv.taxiiHost;
        }

        console.log('~~~', taxiiUrl);
        const allRoots = await getRoots(taxiiUrl);
        const roots = allRoots.filter((root) => argv.taxiiRoot[0].toUpperCase() === 'ALL' || argv.taxiiRoot.includes(root));
        if (!roots.length) {
            reject('Can not find roots');
        } else {
            const collections = [];
            for (const root of roots) {
                const collection = await getCollections(taxiiUrl, root);
                // TODO find out hwo to get collections
            }
        }
        console.log('@@@@', roots);
    // const [roots, collections] = await Promise.all([getRoots(taxiiUrl), getCollections(taxiiUrl)]);

    // const taxiiClient = new TaxiiClient(taxiiUrl);
    });
}
