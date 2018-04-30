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

import fetch from 'node-fetch';

import { IStix, IUFStix } from '../models/interfaces';
import ServiceHelpers from './service-helpers';
import StixToUnfetterAdapater from '../adapters/stix-to-unfetter.adapter';

/**
 * @param  {string} mitreUrl
 * @param  {any} instanceOptions
 * @returns Promise<IUFStix[]>
 * @description Fetches data from MITRE ATT&CK GitHub
 */
function mitreFetch(mitreUrl: string, instanceOptions: any): Promise<IUFStix[]> {
    return new Promise((resolve, reject) => {
        fetch(mitreUrl, instanceOptions)
            .then((fetchRes) => fetchRes.json())
            .then((fetchRes) => {
                const stixToUpload: IUFStix[] = fetchRes.objects
                    .map(StixToUnfetterAdapater.stixToUnfetterStix);

                resolve(stixToUpload);
            })
            .catch((err) => reject(err));
    });
}

/**
 * @param  {string[]} frameworks
 * @returns Promise
 * @description Grabs multiple MITRE ATT&CK framework datasets from GitHub, combines into one array
 */
export default function getMitreData(frameworks: string[]): Promise<IUFStix[]> {
    const promisesArr: [Promise<any>] | any = [];
    frameworks.forEach((framework: MiteStixUrlTypes) => promisesArr.push(mitreFetch(MITRE_STIX_URLS[framework], ServiceHelpers.instanceOptions)));
    return new Promise((resolve, reject) => {
        Promise.all(promisesArr)
            .then((stixToUploadArr: IUFStix[] | any) => resolve(stixToUploadArr.reduce((prev: IUFStix[], cur: IUFStix) => prev.concat(cur), [])))
            .catch((err) => reject(err));
    });
}
