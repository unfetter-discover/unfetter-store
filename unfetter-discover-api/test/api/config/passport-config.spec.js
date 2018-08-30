process.env.RUN_MODE = 'TEST';

const should = require('should');

const passportConfig = require('../../../api/config/passport-config');

describe('passportConfig', () => {
    let mockReq;
    let mockRes;
    beforeEach(() => {
        mockReq = {
            user: null
        };

        mockRes = {
            status() {
                return this;
            },
            json(json) {
                return json;
            }
        };
    });

    describe('jwtStandard', () => {
        it('should response with an error if no user', () => {
            const retVal = passportConfig.jwtStandard(mockReq, mockRes, () => {});
            should.exist(retVal);
        });

        it('should response with an error if user is not approved', () => {
            mockReq.user = {
                approved: false,
                locked: false
            };
            const retVal = passportConfig.jwtStandard(mockReq, mockRes, () => {});
            should.exist(retVal);
        });

        it('should response with an error if user is locked', () => {
            mockReq.user = {
                approved: true,
                locked: true
            };
            const retVal = passportConfig.jwtStandard(mockReq, mockRes, () => {});
            should.exist(retVal);
        });

        it('should response invoke callback with approved unlocked user', done => {
            mockReq.user = {
                approved: true,
                locked: false
            };
            let retVal;
            const callback = () => {
                should.equal(true, true);
                should.not.exist(retVal);
                done();
            };
            retVal = passportConfig.jwtStandard(mockReq, mockRes, callback);
        });
    });

    describe('jwtAdmin', () => {
        it('should response with an error if no user', () => {
            const retVal = passportConfig.jwtAdmin(mockReq, mockRes, () => {});
            should.exist(retVal);
        });

        it('should response with an error if user is not approved', () => {
            mockReq.user = {
                approved: false,
                locked: false,
                role: 'ADMIN'
            };
            const retVal = passportConfig.jwtStandard(mockReq, mockRes, () => {});
            should.exist(retVal);
        });

        it('should response with an error if user is locked', () => {
            mockReq.user = {
                approved: true,
                locked: true,
                role: 'ADMIN'
            };
            const retVal = passportConfig.jwtAdmin(mockReq, mockRes, () => {});
            should.exist(retVal);
        });

        it('should response with an error if user is not an admin', () => {
            mockReq.user = {
                approved: true,
                locked: true,
                role: 'NOT_ADMIN'
            };
            const retVal = passportConfig.jwtAdmin(mockReq, mockRes, () => {});
            should.exist(retVal);
        });

        it('should response invoke callback with approved unlocked admin user', done => {
            mockReq.user = {
                approved: true,
                locked: false,
                role: 'ADMIN'
            };
            let retVal;
            const callback = () => {
                should.equal(true, true);
                should.not.exist(retVal);
                done();
            };
            retVal = passportConfig.jwtAdmin(mockReq, mockRes, callback);
        });
    });
    describe('jwtOrganizations', () => {
        it('should response with an error if no user', () => {
            const retVal = passportConfig.jwtOrganizations(mockReq, mockRes, () => {});
            should.exist(retVal);
        });

        it('should response with an error if user is not approved', () => {
            mockReq.user = {
                approved: false,
                locked: false,
                role: 'ADMIN'
            };
            const retVal = passportConfig.jwtOrganizations(mockReq, mockRes, () => {});
            should.exist(retVal);
        });

        it('should response with an error if user is locked', () => {
            mockReq.user = {
                approved: true,
                locked: true,
                role: 'ADMIN'
            };
            const retVal = passportConfig.jwtOrganizations(mockReq, mockRes, () => {});
            should.exist(retVal);
        });

        it('should response with an error if user is a standard user', () => {
            mockReq.user = {
                approved: true,
                locked: true,
                role: 'STANDARD_USER'
            };
            const retVal = passportConfig.jwtOrganizations(mockReq, mockRes, () => {});
            should.exist(retVal);
        });

        it('should response invoke callback with approved unlocked admin user', done => {
            mockReq.user = {
                approved: true,
                locked: false,
                role: 'ADMIN'
            };
            let retVal;
            const callback = () => {
                should.equal(true, true);
                should.not.exist(retVal);
                done();
            };
            retVal = passportConfig.jwtOrganizations(mockReq, mockRes, callback);
        });

        it('should response invoke callback with approved unlocked org leader user', done => {
            mockReq.user = {
                approved: true,
                locked: false,
                role: 'ORG_LEADER'
            };
            let retVal;
            const callback = () => {
                should.equal(true, true);
                should.not.exist(retVal);
                done();
            };
            retVal = passportConfig.jwtOrganizations(mockReq, mockRes, callback);
        });
    });
});
