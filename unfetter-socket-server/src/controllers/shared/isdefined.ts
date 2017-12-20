import { Request } from 'express';

export function isDefined(obj: any, props: string[]): boolean {
    let holdingObj = { ...obj };
    for (let prop of props) {
        if (holdingObj[prop] === undefined) {
            return false;
        } else {
            holdingObj = holdingObj[prop];
        }
    }
    return true;
}

export function isDefinedJsonApi(req: Request, ...paths: string[][]) {
    for (let path of paths) {
        if (!isDefined(req, ['body', 'data', 'attributes'].concat(path))) {
            return false;
        }
    }
    return true;
}
