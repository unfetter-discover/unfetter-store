import { GranularMarking } from './granular-marking';
import { KillChainPhase } from './kill-chain-phase';
import { StixLabelEnum } from './stix-label.enum';

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

    public toJson(): string {
        return JSON.stringify(this, undefined, '\t');
    }

}
