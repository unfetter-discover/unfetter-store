import * as fs from 'fs';

import filesToJson from './files.adapter';

describe('files adapter', () => {
    
    describe('filesToJson', () => {        
        it('should return an array of file contents', () => {
            spyOn(fs, 'readFileSync').and.returnValue('[{"a":1}]');
            spyOn(fs, 'existsSync').and.returnValue(true);
            const output = filesToJson(['fake/path', 'faker/path']);
            expect(output.length).toBe(2);
        });
        
        it('should return an empty array when json parse fails', () => {
            spyOn(fs, 'readFileSync').and.returnValue('NOT JSON');
            spyOn(fs, 'existsSync').and.returnValue(true);
            const output = filesToJson(['fake/path', 'faker/path']);
            expect(output.length).toBe(0);
        });
        
        it('should return an empty array when file does not exist', () => {
            spyOn(fs, 'readFileSync').and.returnValue('[{"a":1}]');
            spyOn(fs, 'existsSync').and.returnValue(false);
            const output = filesToJson(['fake/path', 'faker/path']);
            expect(output.length).toBe(0);
        });
    });
});
