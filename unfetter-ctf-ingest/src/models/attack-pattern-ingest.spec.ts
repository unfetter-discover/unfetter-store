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
        ap.stage = 'stage5';
    });

    it('should have a constructor', () => {
        expect(ap).toBeDefined();
    });

    it('should generate json', () => {
        const json = ap.toJson();
        expect(json).toContain('killChain');
        expect(json).toContain('description');
        expect(json).toContain('action');
        expect(json).toContain('objective');
        expect(json).toContain('example');
        expect(json).toContain('stage5');
    });
});
