/**
 * attack pattern to ingest from csv file
 */
export class AttackPatternIngest {
    public killChain: string;
    public objective: string;
    public action: string;
    public description: string;
    public example: string;

    public toJson(): string {
        return JSON.stringify(this, undefined, '\t');
    }
}
