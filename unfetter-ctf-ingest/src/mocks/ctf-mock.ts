import { Ctf } from '../models/ctf';
import { Mock } from './mock';

export class CtfMock extends Mock<Ctf> {

    public mockOne(): Ctf {
        const ctf = new Ctf();
        const number = this.genNumber();
        ctf.title = `title-${number}`;
        ctf.author = `author-${number}`;
        ctf.description = `description-${number}`;
        ctf.actionParagraph = `actionPara-${number}`;
        ctf.addedDtg = new Date().toISOString();
        ctf.afaAction = 'Scanning';
        ctf.afaObjective = 'Prepare';
        ctf.alaStage = 'Stage-1';
        ctf.reportId = '123' + new Date().getTime();
        return ctf;
    }

    public mockMany(num = 1): Ctf[] {
        const arr = Array(num);
        for (let idx = 0; idx < num; idx++) {
            arr[idx] = this.mockOne();
        }
        return arr;
    }

}
