export class MarkingDefinition {
    public definition_type: string;
    public definition = {} as { rating: number, label: string };
    public created: Date;
    public readonly type = 'marking­-definition';
    public id: string;
}
