import { existsSync, readFileSync } from 'fs';

/**
 * @param  {string} filePath
 * @returns any
 * @description Returns JSON content of a file, if possible
 */
function readJson(filePath: string): any {
    let json;
    if (existsSync(filePath)) {
        const jsonString = readFileSync(filePath, 'utf-8');
        try {
            json = JSON.parse(jsonString);
        } catch (error) {
            console.log(`Unable to convert file contents of ${filePath} to JSON`);
        }
    } else {
        console.log(`File Path [${filePath}] not found`);
    }
    return json;
}

/**
 * @param  {string[]} filePaths
 * @returns any
 * @description Returns JSON contents of 1-n files
 */
export default function filesToJson(filePaths: string[]): any {
    return filePaths
        .map((filePath) => readJson(filePath))
        .filter((jsonObj) => jsonObj);
}
