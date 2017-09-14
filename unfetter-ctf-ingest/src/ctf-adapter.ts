import { Ctf } from './models/ctf';
import { KillChainPhase } from './models/kill-chain-phase';
import { Stix } from './models/stix';
import { StixLookupService } from './services/stix-lookup.service';

/**
 * @description
 *  Mapping keys from ctf datamodel to stix
 */
export class CtfAdapter {

    private stixLookupService: StixLookupService;

    constructor() {
        this.stixLookupService = new StixLookupService();
    }

    public convertCtfToStix(ctfArray: Ctf[]): Stix[] {
        // "stix" : {
        //     "created" : ISODate("2016-08-01T10:00:00.000Z"),
        //     "modified" : ISODate("2016-08-01T10:00:00.000Z"),
        //     "version" : 0,
        //     "labels" : [],
        //     "external_references" : [ 
        //         {
        //             "url" : "https://attack.mitre.org/wiki/Technique/T1003",
        //             "external_id" : "T1003",
        //             "source_name" : "attack.mitre.org"
        //         }
        //     ],
        //     "granular_markings" : [],
        //     "name" : "Credential Dumping",
        //     "description" : "fafsadfsd
        //     "kill_chain_phases" : [
        //         {
        //             "phase_name" : "credential-access",
        //             "kill_chain_name" : "mitre-attack"
        //         }
        //     ],
        //     "x_unfetter_sophistication_level" : 2,
        //     "type" : "attack-pattern",
        //     "id" : "attack-pattern--0541e9a2-fafa-4ada-8466-cb20f5b021ba"
        // },

        const stixies = ctfArray.map((ctf) => this.mapCtfToStix(ctf));
        return stixies;
    }

    public mapCtfToStix(ctf: Ctf): Stix {
        const stix = new Stix();
        stix.type = 'report';

        if (!ctf) {
            return stix;
        }

        if (ctf.title) {
            stix.title = ctf.title;
        }

        const reportId = ctf.reportId;
        const sourceType = ctf.sourceType;
        const description = ctf.description;
        if (reportId || sourceType || description) {
            const externalRef = {
                external_id: ctf.reportId,
                external_url: ctf.reportId,
                source_name: sourceType,
                description,
            };
            stix.external_references = stix.external_references || [];
            stix.external_references.push(externalRef);
        }

        stix.description = ctf.afaObjective;

        if (ctf.author) {
            stix.created_by_ref = ctf.author;
        }

        if (ctf.reportDtg) {
            stix.created = ctf.reportDtg;
        }

        if (ctf.actionClassification || ctf.reportClassification
            || ctf.declassification) {
            const arr = [ctf.actionClassification,
            ctf.reportClassification, ctf.declassification];
            stix.granular_markings = stix.granular_markings || [];
            stix.granular_markings.concat(arr);
        }

        if (ctf.addedDtg) {
            stix.modified = ctf.addedDtg;
        }

        if (ctf.alaStage) {
            const killChainName = new KillChainPhase();
            killChainName.phase_name = ctf.alaStage;
            stix.kill_chain_phases = stix.kill_chain_phases || [];
            stix.kill_chain_phases.push(killChainName);
        }

        stix.name = ctf.afaAction;

        return stix;
    }

    /**
     *
     * @param {string} name
     * @throws {Error} if name is undefined or empty
     */
    private lookupAttackPattern(name: string = ''): string {
        name = name ? name.trim() : '';
        if (!name || name.length === 0) {
            throw new Error('name parameter is empty or not defined!');
        }

        // this.stixLookupService.findAttackPatternByName(name)
        throw new Error('not implemented');
    }
}
