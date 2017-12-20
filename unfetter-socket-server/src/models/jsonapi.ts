export interface JsonApi {
    data: {
        attributes: any;
    }
}

export interface JsonApiError {
    status: string;
    source: {
        pointer: string
    },
    title: string,
    detail?: string
}

export class CreateJsonApiError {
    public errors: JsonApiError[] = [];
    constructor(status: string, pointer: string, title: string, detail?: string) {
        if (detail) {
            this.addError(status, pointer, title, detail);

        } else {
            this.addError(status, pointer, title);
        }
    }

    public addError(status: string, pointer: string, title: string, detail?: string) {
        const newError: JsonApiError = {
            status,
            source: {
                pointer
            },
            title
        };
        if (detail) {
            newError.detail = detail;
        }
        this.errors.push(newError);
    }
}

export class CreateJsonApiSuccess {
    public data: {};
    constructor(attributes: {}) {
        this.data = {
            attributes
        };
    }
}
