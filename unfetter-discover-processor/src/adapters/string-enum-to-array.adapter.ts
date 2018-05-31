/**
 * @param  {any} _enum
 * @returns string
 * @description Returns all possible values from enum
 * WARNING: const enums may NOT be used with this function
 */
export default function stringEnumToArray(_enum: any): string[] {
    return Object.values(_enum);
}
