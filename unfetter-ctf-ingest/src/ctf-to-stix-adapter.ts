import { AttackPattern } from './models/attack-pattern';
import { Ctf } from './models/ctf';
import { KillChainPhase } from './models/kill-chain-phase';
import { Stix } from './models/stix';
import { StixLookupService } from './services/stix-lookup.service';

/**
 * @description
 *  Mapping keys from ctf datamodel to stix
 */
export class CtfToStixAdapter {

    protected stixLookupService: StixLookupService;

    constructor() {
        this.stixLookupService = new StixLookupService();
    }

    public setStixLookupService(service: StixLookupService): void {
        this.stixLookupService = service;
    }

    public async convertCtfToStix(ctfArray: Ctf[]): Promise<Stix[]> {
        const stixies = ctfArray.map((ctf) => this.mapCtfToStix(ctf));
        return Promise.all(stixies);
    }

    public async mapCtfToStix(ctf: Ctf): Promise<Stix> {
        const stix = new Stix();
        stix.type = 'report';

        if (!ctf) {
            return stix;
        }

        if (ctf.title) {
            // TODO: should this be title or name?
            stix.title = ctf.title;
            stix.name = ctf.title;
        }

        const reportId = ctf.reportId;
        const sourceType = ctf.sourceType;
        const description = ctf.description;
        if (reportId || sourceType || description) {
            // TODO: should the report id value might actually be a link
            //  so should I consider it an id or url?
            const externalRef = {
                external_id: ctf.reportId,
                external_url: ctf.reportId,
                source_name: sourceType,
                description,
            };
            stix.external_references = stix.external_references || [];
            stix.external_references.push(externalRef);
        }

        stix.description = `${ctf.alaStage} - ${ctf.afaObjective}`;

        if (ctf.author) {
            stix.created_by_ref = ctf.author;
        }

        if (ctf.reportDtg) {
            stix.created = ctf.reportDtg;
        }

        if (ctf.actionClassification || ctf.reportClassification
            || ctf.declassification) {
            const classifications = [ctf.actionClassification,
            ctf.reportClassification, ctf.declassification];
            stix.granular_markings = stix.granular_markings || [];
            const markings = await Promise.all(classifications
                .filter((classif) => classif && classif.trim().length > 0)
                .map((classif) => {
                    return this.stixLookupService
                        .findMarkingDefinitionByLabel(ctf.actionClassification);
                }));
            const markingRefs = markings
                .reduce((memo, curMarkings) => memo.concat(...curMarkings), [])
                .filter((el) => el.id)
                .map((marking) => {
                    return {
                        marking_ref: marking.id,
                        selectors: [ 'name', 'description', 'title', 'x_unfetter_object_actions' ],
                    };
                });
            console.log('found markings', markings);
            stix.granular_markings = [...stix.granular_markings, ...markingRefs];
        }

        if (ctf.addedDtg) {
            stix.modified = ctf.addedDtg;
        }

        const attackPatternName = ctf.afaAction;
        stix.object_refs = stix.object_refs || [];
        const attackPatterns = await this.lookupAttackPattern(attackPatternName);
        const patternIds = attackPatterns.map((attackPattern) => attackPattern.id);
        stix.object_refs = stix.object_refs.concat(patternIds);

        if (ctf.actionParagraph) {
            stix.x_unfetter_object_actions = stix.x_unfetter_object_actions || [];
            stix.x_unfetter_object_actions.push(ctf.actionParagraph);
        }

        return stix;
    }

    /**
     * @param {Promise<AttackPattern[]>} name
     * @throws {Error} if name is undefined or empty
     */
    private lookupAttackPattern(name: string = ''): Promise<AttackPattern[]> {
        name = name ? name.trim() : '';
        if (!name || name.length === 0) {
            throw new Error('name parameter is empty or not defined!');
        }

        return this.stixLookupService.findAttackPatternByName(name);
    }
}
