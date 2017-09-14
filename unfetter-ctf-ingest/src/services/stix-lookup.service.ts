import fetch from 'node-fetch';

/**
 * @description
 *  class to make calls to the backend API
 */
export class StixLookupService {

    protected static readonly apiUrl = `https://localhost/api`;
    protected static readonly attackPatternPath = `/attack-patterns`;

    /**
     * @description
     *  lookup up attack pattern by name
     * @param {string} name
     */
    public findAttackPatternByName(name: string): any {
        if (!name) {
            return;
        }

        const filter = JSON.stringify({
            name,
        });
        const queryParams = encodeURIComponent(`filter=${filter}`);
        const url = `${StixLookupService.apiUrl}${StixLookupService.attackPatternPath}?${queryParams}`;
        const resp = fetch(url)
            .then((res) => {
                console.log(res);
                return res;
            });

        return resp;
    }
}
