import { Stix } from './models/stix';

/**
 * @description class to post stix objects to UNFETTER API
 */
export class UnfetterPoster {

    public uploadStix(stix: Stix[] = []): void {
        if (!stix || stix.length < 1) {
            return;
        }
        // const nodePost =
    }

}
