import fetch from 'node-fetch';
import { JsonSchema } from '../models/json-schema';
import { Stix } from '../models/stix';

/**
 * @description class to post stix objects to UNFETTER API
 */
export class UnfetterPosterService {
    protected static readonly apiUrl = `https://localhost/api`;
    protected static readonly path = `/reports`;

    constructor() {
        // fix the self signed cert error
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    public async uploadJsonSchema(arr: JsonSchema[] = []): Promise<any[]> {
        if (!arr || arr.length < 1) {
            Promise.resolve([]);
        }
        const url = `${UnfetterPosterService.apiUrl}${UnfetterPosterService.path}`;
        const promises = arr.map((jsonSchema) => {
            const body = JSON.stringify(jsonSchema);
            console.log(body);
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
