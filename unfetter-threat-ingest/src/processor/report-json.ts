export default interface ReportJSON {
    stix: {
        id: string | null,
        name: string,
        labels: string[],
        published: number | Date,
        description: string,
        object_refs?: string[],
        created_by_ref?: string,
        external_references?: any[],
        object_marking_refs?: string[],
        granular_markings?: any[],
    };
    metaProperties: {
        [key: string]: any;
    };
}
