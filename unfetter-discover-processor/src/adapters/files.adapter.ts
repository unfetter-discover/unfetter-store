import { existsSync, readFileSync } from 'fs';

function readJson(filePath: string): object {
    let json;
    if (existsSync(filePath)) {
        const jsonString = readFileSync(filePath, 'utf-8');
        json = JSON.parse(jsonString);
    } else {
        console.log(`File Path [${filePath}] not found`);
    }
    return json;
}

export default function filesToJson(filePaths: string[]): object[] {
    return filePaths
        .map((filePath) => readJson(filePath))
        .filter((jsonObj) => jsonObj);
}
