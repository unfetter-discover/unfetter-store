import * as https from 'https';
import fetch from 'node-fetch';
import { Environment } from '../environment';
import { AttackPattern } from '../models/attack-pattern';
import { MarkingDefinition } from '../models/marking-definition';
import { StixLookupService } from './stix-lookup-service';

/**
 * @description
 *  class to make calls to the backend API
 */
export class StixLookupRestService implements StixLookupService {

    protected readonly attackPatternPath = `attack-patterns`;
    protected readonly markingDefinitionsPath = `marking-definitions`;
    protected readonly apiUrl: string;

    constructor() {
        // fix the self signed cert error
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        this.apiUrl =
            `${Environment.apiProtocol}://${Environment.apiHost}:${Environment.apiPort}${Environment.context}`;
    }

    /**
     * @description
     *  lookup up attack pattern by name
     * @param {string} name
     * @returns {AttackPattern[]}
     */
    public findAttackPatternByName(name = ''): Promise<AttackPattern[]> {
        if (!name || name.trim().length === 0) {
            return Promise.resolve([]);
        }

        const filter = JSON.stringify({
            'stix.name': name,
        });

        // needed to connect to a self signed cert in development
        // const agent = new https.Agent({
        //   rejectUnauthorized: false,
        // });

        // fetch(url, {
        //     headers: {
        //         'content-type': 'application/json',
        //     }})

        const queryParams = `filter=${encodeURIComponent(filter)}`;
        const url = `${this.apiUrl}${this.attackPatternPath}?${queryParams}`;
        console.log(`fetch ${url}`);
        const resp = fetch(url)
            .then((res) => {
                // console.log(res.headers.get('content-type'));
                const result = res.json().then((json) => {
                    if (!json || !json.data || json.data.length < 1 || !json.data[0].id) {
                        const msg = `did not find attack pattern for ${name}`;
                        // return Promise.reject();
                        throw new Error(msg);
                    }
                    return json.data as AttackPattern[];
                });
                return result;
            })
            .catch((err) => {
                console.log(err);
                return Promise.reject([]);
            });

        return resp;
    }

    /**
     * @description lookup up marking definition by label
     * @param {string} name
     * @returns {MarkingDefinition[]}
     */
    public findMarkingDefinitionByLabel(label: string): Promise<MarkingDefinition[]> {
        if (!label) {
            return Promise.resolve([]);
        }

        const filter = JSON.stringify({
            'stix.definition.label': label,
        });

        const queryParams = `filter=${encodeURIComponent(filter)}`;
        const url = `${this.apiUrl}${this.markingDefinitionsPath}?${queryParams}`;
        const resp = fetch(url)
            .then((res) => {
                const result = res.json().then((json) => {
                    if (!json || !json.data || json.data.length < 1 || !json.data[0].id) {
                        const msg = `did not find marking definition for ${label}`;
                        throw new Error(msg);
                    }
                    return json.data as MarkingDefinition[];
                });
                return result;
            })
            .catch((err) => {
                console.log(err);
                return Promise.reject([]);
            });

        return resp;
    }
}
