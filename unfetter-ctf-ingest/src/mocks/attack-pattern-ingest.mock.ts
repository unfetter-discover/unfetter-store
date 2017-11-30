import { AttackPatternIngest } from '../models/attack-pattern-ingest';
import { Mock } from './mock';

export class AttackPatternIngestMock extends Mock<AttackPatternIngest> {

    public mockOne(num?: number): AttackPatternIngest {
        const mock = new AttackPatternIngest();
        mock.action = 'action' + ( '-' + num || '');
        mock.description = 'description';
        mock.killChain = 'them sofly';
        mock.objective = 'world peace?';
        return mock;
    }

    public mockMany(num = 1): AttackPatternIngest[] {
        const arr = Array(num);
        for (let idx = 0; idx < num; idx++) {
            arr[idx] = this.mockOne();
        }
        return arr;
    }

}
