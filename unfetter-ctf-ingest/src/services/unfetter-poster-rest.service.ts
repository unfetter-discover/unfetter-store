import fetch from 'node-fetch';
import { Environment } from '../environment';
import { JsonSchema } from '../models/json-schema';
import { Stix } from '../models/stix';

/**
 * @description class to post stix objects to UNFETTER API
 */
export class UnfetterPosterRestService {
    protected readonly path = `reports`;
    protected apiUrl: string;

    constructor() {
        // fix the self signed cert error
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        this.apiUrl =
            `${Environment.apiProtocol}://${Environment.apiHost}:${Environment.apiPort}${Environment.context}`;
    }

    public async uploadJsonSchema(arr: JsonSchema[] = []): Promise<any[]> {
        if (!arr || arr.length < 1) {
            Promise.resolve([]);
        }
        const url = `${this.apiUrl}${this.path}`;
        const promises = arr.map((jsonSchema) => {
            const body = JSON.stringify(jsonSchema);
            // console.log(body);
            return fetch(url, {
                headers: this.genHeaders(),
                method: 'POST',
                body,
            })
            .then((res) => {
                return res.json();
            });
        });
        return Promise.all(promises);
    }

    protected genHeaders(): { [key: string]: string } {
        return { 'content-type': 'application/json' };
    }
}
