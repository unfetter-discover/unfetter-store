import { ReportCtf } from './report-ctf';

describe('ctf model', () => {

    let ctf: ReportCtf;

    beforeEach(() => {
        ctf = new ReportCtf();
        ctf.title = 'title';
        ctf.author = 'author';
        ctf.afaAction = 'action';
        ctf.afaObjective = 'objective';
        ctf.alaStage = 'stage';
    });

    it('should have a constructor', () => {
        expect(ctf).toBeDefined();
    });

    it('should generate json', () => {
        expect(ctf.toJson()).toContain('title');
        expect(ctf.toJson()).toContain('author');
        expect(ctf.toJson()).toContain('action');
        expect(ctf.toJson()).toContain('objective');
        expect(ctf.toJson()).toContain('stage');
    });
});
