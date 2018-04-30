import fetch from 'node-fetch';

import ServiceHelpers from './service-helpers';
import { IStix, IUFStix } from '../models/interfaces';
import StixToUnfetterAdapater from '../adapters/stix-to-unfetter.adapter';

export class TaxiiClient {
    /**
     * @param  {string} url
     * @returns Promise<string[]>
     * @description Gets api roots present on a TAXII server
     */
    public static getRoots(url: string): Promise<string[]> {
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
     * @param  {string} root
     * @returns Promise<string[]>
     * @description Gets TAXII collections by api root
     */
    public static getCollections(url: string, root: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            fetch(`http://${url}/${root}/collections`, {
                ...ServiceHelpers.instanceOptions,
                headers: ServiceHelpers.taxiiHeaders
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.collections) {
                        const collectionIds: string[] = data.collections
                            .map((collection: any) => collection.id);
                        resolve(collectionIds);
                    } else {
                        resolve([]);
                    }
                })
                .catch((err) => reject(err));
        });
    }

    /**
     * @param  {string} url
     * @param  {string} root
     * @param  {string} collectionId
     * @returns Promise<IStix[]>
     * @description Gets STIX objects by a TAXII root and collection id
     */
    public static getObjects(url: string, root: string, collectionId: string): Promise<IStix[]> {
        return new Promise((resolve, reject) => {
            fetch(`http://${url}/${root}/collections/${collectionId}/objects`, {
                ...ServiceHelpers.instanceOptions,
                headers: ServiceHelpers.stixHeaders
            })
                .then((response) => response.json())
                .then((bundle: { objects: IStix[] }) => {
                    if (bundle.objects && bundle.objects.length) {
                        resolve(bundle.objects);
                    } else {
                        resolve([]);
                    }
                })
                .catch((err) => reject(err));
        });
    }
}

/**
 * @returns Promise<IStix[]>
 * @param {any} localArgv
 * @description Returns a single array of all STIX results from all requests TAXII roots and collections
 */
export default function getTaxiiData(localArgv: any): Promise<IUFStix[]> {
    return new Promise(async (resolve, reject) => {
        try {
            let taxiiUrl;
            if (localArgv.taxiiPort) {
                taxiiUrl = `${localArgv.taxiiHost}:${localArgv.taxiiPort}`;
            } else {
                taxiiUrl = localArgv.taxiiHost;
            }

            // Get roots
            const allRoots = await TaxiiClient.getRoots(taxiiUrl);
            const roots = allRoots
                .filter((root) => localArgv.taxiiRoot[0].toString().toUpperCase() === 'ALL' || localArgv.taxiiRoot.includes(root));

            if (!roots.length) {
                reject('Can not find roots');
            } else {
                let allObjects: IStix[] = [];
                for (const root of roots) {
                    // Get collections by root
                    const allCollectionIds = await TaxiiClient.getCollections(taxiiUrl, root);
                    const collectionIds = allCollectionIds
                        .filter((collectionId: string) => localArgv.taxiiCollection[0].toString().toUpperCase() === 'ALL' || localArgv.taxiiCollection.includes(collectionId));

                    for (const collectionId of collectionIds) {
                        // Get objects by collection
                        const objects = await TaxiiClient.getObjects(taxiiUrl, root, collectionId);
                        allObjects = allObjects.concat(objects);
                    }
                }
                resolve(allObjects.map(StixToUnfetterAdapater.stixToUnfetterStix));
            }
        } catch (error) {
            reject(error);
        }
    });
}
