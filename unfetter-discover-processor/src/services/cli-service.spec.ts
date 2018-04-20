import argv from './cli.service';

describe('cli service (yargs)', () => {
    it('should display certain defaults', () => {
        expect(argv.a).toBe(true);
        expect(argv.h).toBe('localhost');
        expect(argv.d).toBe('stix');
        expect(argv.p).toBe(27017);
    });
});
