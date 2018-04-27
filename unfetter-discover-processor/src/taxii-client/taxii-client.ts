export default class TaxiiClient {

    private baseUrl: string;
    private roots: string[];
    private collections: string[];

    constructor(baseUrl: string, roots: string[], collections: string[]) {
        this.baseUrl = baseUrl;
        this.roots = roots;
        this.collections = collections;
    }
}
