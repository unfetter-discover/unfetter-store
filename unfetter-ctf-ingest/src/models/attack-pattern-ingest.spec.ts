import { AttackPatternIngest } from './attack-pattern-ingest';

describe('attack pattern ingest model', () => {

    let ap: AttackPatternIngest;

    beforeEach(() => {
        ap = new AttackPatternIngest();
        ap.killChain = 'sample-kill-chain';
        ap.objective = 'smash and grab';
        ap.action = 'breaking and enter';
        ap.description = 'its when bad people break stuff';
        ap.example = 'like that time';
    });

    it('should have a constructor', () => {
        expect(ap).toBeDefined();
    });

    it('should generate json', () => {
        expect(ap.toJson()).toContain('killChain');
        expect(ap.toJson()).toContain('description');
        expect(ap.toJson()).toContain('action');
        expect(ap.toJson()).toContain('objective');
        expect(ap.toJson()).toContain('example');
    });
});
