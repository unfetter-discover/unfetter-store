/**
 * attack pattern to ingest from csv file
 */
export class AttackPatternIngest {
    public killChain = '';
    public objective = '';
    public action = '';
    public description = '';
    public example = '';
    public stage = '';

    public toJson(): string {
        return JSON.stringify(this, undefined, '\t');
    }
}
