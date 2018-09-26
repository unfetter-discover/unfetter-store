export default interface ReportJSON {
    stix: {
        id: string | null,
        name: string,
        labels: string[],
        published: number,
        description: string,
        object_refs?: string[],
        created_by_ref?: string
    };
    metaProperties: {
        [key: string]: any;
    };
}
