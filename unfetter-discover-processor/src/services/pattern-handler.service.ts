import fetch, { RequestInit, BodyInit } from 'node-fetch';

import { IUFStix } from '../models/interfaces';
import argv from './cli.service';
import ServiceHelpers from './service-helpers';

export interface PatternHandlerValidated {
    validated: boolean;
    pattern: string;
}

export interface PatternHandlerTranslateAll extends PatternHandlerValidated {
    'cim-splunk': string;
    'car-splunk': string;
    'car-elastic': string;
}

export interface PatternHandlerGetObjects extends PatternHandlerValidated {
    object: [
        {
            name: string;
            property: string;
        }
    ]
}

export default class PatternHandlerService {
    public static async handlePatterns(stix: IUFStix[]): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const stixWithPattern = stix.filter((obj) => obj.stix.pattern);
            const promises: Array<Promise<any>> = stix
                .filter((obj) => obj.stix.pattern)
                .map((obj) => PatternHandlerService.handlePattern(obj));

            if (promises.length) {
                await Promise.all(promises);
            }
            resolve('All patterns processed');
        });       
    }

    public static getTranslations(pattern: string): Promise<PatternHandlerTranslateAll> {
        const body: BodyInit = JSON.stringify({ pattern });
        const options: RequestInit = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body
        };
        return new Promise((resolve, reject) => {
            fetch(this.TRANSLATE_ALL_URL, options)
                .then((fetchRes) => fetchRes.json())
                .then((fetchRes) => {
                    resolve(fetchRes);
                })
                .catch((err) => reject(err));
        });
    }

    public static getObjects(pattern: string): Promise<PatternHandlerGetObjects> {        
        const body: BodyInit = JSON.stringify({ pattern });
        const options: RequestInit = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body
        };
        return new Promise((resolve, reject) => {
            fetch(this.GET_OBJECTS_URL, options)
                .then((fetchRes) => fetchRes.json())
                .then((fetchRes) => {
                    resolve(fetchRes);
                })
                .catch((err) => reject(err));
        });
    }

    private static readonly TRANSLATE_ALL_URL = `http://${argv.patternHandlerDomain}:${argv.patternHandlerPort}/translate-all`;
    private static readonly GET_OBJECTS_URL = `http://${argv.patternHandlerDomain}:${argv.patternHandlerPort}/get-objects`;  

    private static async handlePattern(stix: IUFStix): Promise<any> {
        return new Promise(async (resolve, reject) => {
            const { pattern } = stix.stix;
            const translations = await PatternHandlerService.getTranslations(pattern);
            if (translations['cim-splunk'] || translations['car-splunk'] || translations['car-elastic']) {
                if (!stix.metaProperties) {
                    stix.metaProperties = {};
                }
                stix.metaProperties.queries = {
                    carElastic: {
                        query: translations['car-elastic'],
                        include: true
                    },
                    carSplunk: {
                        query: translations['car-splunk'],
                        include: true
                    },
                    cimSplunk: {
                        query: translations['cim-splunk'],
                        include: true
                    }
                };

                // Assume that objects can only be retrieved if translations were recieved
                const objects = await PatternHandlerService.getObjects(pattern);
                if (objects.object) {
                    stix.metaProperties.observedData = objects.object.map((obj) => ({ ...obj, action: '*' }))
                }

            }

            resolve('STIX processed');
        });
    }    
   
}
