import stringEnumToArray from './string-enum-to-array.adapter';

enum MockEnum {
    TEST = 'TEST',
    TEST2 = 'TEST2'
}

describe('stringEnumToArray', () => {    
    it('should convert string enum to string array', () => {
        const res = stringEnumToArray(MockEnum);
        expect(res.length).toBe(2);
        expect(res[0]).toBe('TEST');
        expect(res[1]).toBe('TEST2');
    });
});
