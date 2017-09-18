import { GranularMarking } from '../models/granular-marking';
import { MarkingDefinition } from '../models/marking-definition';
import { Stix } from '../models/stix';
import { Mock } from './mock';

export class StixMock extends Mock<Stix> {

    public mockOne(): Stix {
        const stix = new Stix();
        const number = this.genNumber();
        stix.id = `stix-${number}`;
        stix.name = `name-${number}`;
        stix.description = `description-${number}`;
        stix.object_refs = ['1', '2'];
        stix.modified = new Date().toISOString();
        stix.title = 'title-${number}';
        stix.granular_markings = [ new GranularMarking() ];
        return stix;
    }

    public mockMany(num = 1): Stix[] {
        const arr = Array(num);
        for (let idx = 0; idx < num; idx++) {
            arr[idx] = this.mockOne();
        }
        return arr;
    }
}
