import { AttackPatternIngestToStixAdapter } from '../../adapters/attack-pattern-ingest-to-stix.adapter';
import { Stix } from '../../models/stix';
import { MongoConnectionService } from '../mongo-connection.service';
import { AttackPatternIngestService } from './attack-pattern-ingest.service';

describe('Ctf ingest service', () => {

    let service: AttackPatternIngestService;
    let adapter: AttackPatternIngestToStixAdapter;
    let csv: string;
    let mockIdent: Stix;

    beforeEach(() => {
        mockIdent = new Stix();
        mockIdent.stix = {};
        mockIdent.stix.id = '123';
        mockIdent.id = mockIdent.stix.id;
        mockIdent.name = 'system';

        const spy = spyOn(MongoConnectionService, 'getCollection');
        adapter = new AttackPatternIngestToStixAdapter();
        const adapterSpy = spyOn(adapter, 'lookupSystemIdentity').and.returnValue(mockIdent);
        service = new AttackPatternIngestService();
        service.setAttackPatternIngestToStixAdapter(adapter);

        csv = 'KillChain,Objective,Action,Description,Example\n' +
            'kill-chain-sample,reconnaissance,\"Harvest email addresses\",\"description of the attack.\",';
    });

    it('should have a constructor', () => {
        expect(service).toBeDefined();
    });

    it('should transform csv to stix', async () => {
        const stix1 = new Stix();
        const stix2 = new Stix();
        const spy = spyOn(service, 'csvToStix');
        spy.and.returnValue([stix1, stix2]);

        const promise = service.csvToStix();
        expect(promise).toBeDefined();
        const arr = await promise;
        expect(arr.length).toEqual(2);
    });

    it('should return empty array with no csv', async () => {
        const promise = service.csvToStix();
        expect(promise).toBeDefined();
        const arr = await promise;
        expect(arr.length).toEqual(0);
    });

    it('should transform csv to stix', async () => {
        const promise = service.csvToStix(csv);
        expect(promise).toBeDefined();
        const arr = await promise;
        expect(arr.length).toEqual(1);
        const stix = arr[0];
        expect(stix).toBeDefined();
        expect(stix.type).toEqual('attack-pattern');
        expect(stix.name).toContain('email addresses');
        expect(stix.kill_chain_phases.length).toEqual(1);
        expect(stix.kill_chain_phases[0].kill_chain_name).toBeDefined();
        expect(stix.kill_chain_phases[0].kill_chain_name).toEqual('kill-chain-sample');
        expect(stix.kill_chain_phases[0].phase_name).toBeDefined();
        expect(stix.kill_chain_phases[0].phase_name).toEqual('reconnaissance');
    });
});
