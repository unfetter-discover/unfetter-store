import { GranularMarking } from './granular-marking';
import { KillChainPhase } from './kill-chain-phase';
import { StixLabelEnum } from './stix-label.enum';

/**
 * @description Stix 2.0 likeness
 */
export class Stix {
    public id: string;
    // tslint:disable-next-line:variable-name
    // public _id: string;
    public name: string;
    public description: string;
    public labels: StixLabelEnum[];
    public published: Date;
    public object_refs: string[];
    public type = 'report';
    public kill_chain_phases: KillChainPhase[];
    public title: string;
    public external_references: any[];
    public created: string;
    public modified: string;
    public created_by_ref: string;
    public granular_markings: GranularMarking[];
    public x_unfetter_object_actions: string[];

    public stix?: any;

    /**
     * @description generate json from this object
     * @return {string}
     */
    public toJson(delim = '\t'): string {
        return JSON.stringify(this, undefined, delim);
    }

}
