export class ReportCtf {
    public reportId = '';
    public title = '';
    public sourceType = '';
    public alaStage = '';
    public afaObjective = '';
    public afaAction = '';
    public description = '';
    public actionParagraph = '';
    public actionClassification = '';
    public reportClassification = '';
    public reportDtg = '';
    public declassification = '';
    public ala = '';
    public ama = '';
    public afa = '';
    public author = '';
    public addedDtg = '';
    public qcAuthor = '';
    public qcDtg = '';

    public toJson(): string {
        return JSON.stringify(this, undefined, '\t');
    }
}
