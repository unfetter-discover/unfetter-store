import getTaxiiData, { TaxiiClient } from './taxii-client.service';

describe('Taxii Client Service', () => {

    describe('getTaxiiData', () => {

        const mockArgv = {
            taxiiRoot: ['all'],
            taxiiCollection: ['all']
        };

        beforeEach(() => {
            spyOn(TaxiiClient, 'getRoots').and.returnValue(['stix', 'stix2']);
            spyOn(TaxiiClient, 'getCollections').and.returnValue(['1234', '5678', '9012']);
            spyOn(TaxiiClient, 'getObjects').and.returnValue([{id: '5678'}, { id: '9012'}]);
        });

        it('Should return all objects with `all` arguments on root and collection', (done) => {
            getTaxiiData(mockArgv)
                .then((data) => {
                    expect(data.length).toBe(12);
                    done();
                })
                .catch((err) => {
                    fail('This block should not be reached');
                    done();
                });
        });

        it('Should return correct objects with root specified', (done) => {
            const filtetedArgv = {
                ...mockArgv,
                taxiiRoot: ['stix']
            };
            getTaxiiData(filtetedArgv)
                .then((data) => {
                    expect(data.length).toBe(6);
                    done();
                })
                .catch((err) => {
                    fail('This block should not be reached');
                    done();
                });
        });

        it('Should return correct objects with collections specified', (done) => {
            const filtetedArgv = {
                ...mockArgv,
                taxiiCollection: ['1234', '9012']
            };
            getTaxiiData(filtetedArgv)
                .then((data) => {
                    expect(data.length).toBe(8);
                    done();
                })
                .catch((err) => {
                    fail('This block should not be reached');
                    done();
                });
        });

        it('Should return correct objects with root and collections specified', (done) => {
            const filtetedArgv = {
                ...mockArgv,
                taxiiRoot: ['stix'],
                taxiiCollection: ['1234', '9012']
            };
            getTaxiiData(filtetedArgv)
                .then((data) => {
                    expect(data.length).toBe(4);
                    done();
                })
                .catch((err) => {
                    fail('This block should not be reached');
                    done();
                });
        });
    });
});
