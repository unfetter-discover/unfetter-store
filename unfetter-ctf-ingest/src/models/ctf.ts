export class Ctf {
    public reportId: any;
    public title: any;
    public sourceType: any;
    public alaStage: any;
    public afaObjective: any;
    public afaAction: any;
    public description: any;
    public actionParagraph: any;
    public actionClassification: any;
    public reportClassification: any;
    public reportDtg: any;
    public declassification: any;
    public ala: any;
    public ama: any;
    public afa: any;
    public author: any;
    public addedDtg: any;
    public qcAuthor: any;
    public qcDtg: any;

    public toJson(): string {
        return JSON.stringify(this, undefined, '\t');
    }
}
