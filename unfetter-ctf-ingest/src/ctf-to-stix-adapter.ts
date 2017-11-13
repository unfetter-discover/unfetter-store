import { AttackPattern } from './models/attack-pattern';
import { Ctf } from './models/ctf';
import { KillChainPhase } from './models/kill-chain-phase';
import { MarkingDefinition } from './models/marking-definition';
import { Stix } from './models/stix';
import { StixLookupMongoService } from './services/stix-lookup-mongo.service';

/**
 * @description
 *  Mapping keys from ctf datamodel to stix
 */
export class CtfToStixAdapter {

    protected stixLookupService: StixLookupMongoService;

    constructor() {
        this.stixLookupService = new StixLookupMongoService();
    }

    public setStixLookupService(service: StixLookupMongoService): void {
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
            // console.log('setting classifications');
            const classifications =
                [ctf.actionClassification, ctf.reportClassification, ctf.declassification];
            stix.granular_markings = stix.granular_markings || [];
            const markings = await Promise.all(classifications
                .filter((classif) => classif && classif.trim().length > 0)
                .map((classif) => {
                    return this.stixLookupService
                        .findMarkingDefinitionByLabel(ctf.actionClassification);
                }));
            // console.log('found markings', markings);
            const markingRefs = markings
                .reduce((memo, curMarkings) => memo.concat(curMarkings), [] as MarkingDefinition[])
                .map(this.mapMongoId)
                .map((marking) => {
                    return {
                        marking_ref: marking.id,
                        selectors: ['name', 'description', 'title', 'x_unfetter_object_actions'],
                    };
                });
            // console.log('found markings', markingRefs);
            stix.granular_markings = [...stix.granular_markings, ...markingRefs];
        }

        if (ctf.addedDtg) {
            stix.modified = ctf.addedDtg;
        }

        // console.log('setting attackpatterns');
        const attackPatternName = ctf.afaAction;
        stix.object_refs = stix.object_refs || [];
        const attackPatterns = await this.lookupAttackPattern(attackPatternName);
        // console.log('found attackpatterns, ', attackPatterns);
        const patternIds = attackPatterns
            .map(this.mapMongoId)
            .map((attackPattern) => attackPattern.id);
        stix.object_refs = stix.object_refs.concat(patternIds);
        // console.log(stix.object_refs);

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
    private async lookupAttackPattern(name: string = ''): Promise<AttackPattern[]> {
        if (!name || name.trim().length === 0) {
            throw new Error('name parameter is empty or not defined!');
        }

        return this.stixLookupService.findAttackPatternByName(name);
    }

    /**
     * @description map mongo _id to .id
     * @param obj
     * @return {any} obj given, but with ._id assigend to .id
     */
    private mapMongoId(obj: any): any {
        const tmp: any = obj;
        if (tmp['_id'] && !tmp.id) {
            tmp.id = tmp['_id'];
        }
        return tmp;
    }
}
