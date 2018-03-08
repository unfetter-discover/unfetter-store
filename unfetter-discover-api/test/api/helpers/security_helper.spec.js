const SecurityHelper = require('../../../api/helpers/security_helper');
const should = require('should');

process.env.RUN_MODE = 'TEST';


describe('security helper tests', () => {
    const STANDARD_USER_ROLE = 'STANDARD_USER';
    const ADMIN_ROLE = 'ADMIN';
    let user;

    const genUser = () => {
        return {
            role: 'STANDARD_USER',
            locked: false,
            approved: true,
        };
    }

    describe('isAdmin', () => {
        beforeEach('', () => {
            user = genUser();
        });

        it(`should calculate isAdmin for standard user role`, () => {
            user.role = STANDARD_USER_ROLE;
            const hasAdmin = SecurityHelper.isAdmin(user);
            should.exist(hasAdmin);
            should.equal(typeof hasAdmin, 'boolean');
            should.equal(hasAdmin, false);
        });

        it(`should calculate isAdmin for admin role`, () => {
            user.role = ADMIN_ROLE;
            const hasAdmin = SecurityHelper.isAdmin(user);
            should.exist(hasAdmin);
            should.equal(typeof hasAdmin, 'boolean');
            should.equal(hasAdmin, true);
        });

        it(`should calculate isAdmin for locked user`, () => {
            user.role = ADMIN_ROLE;
            user.locked = true;
            const hasAdmin = SecurityHelper.isAdmin(user);
            should.exist(hasAdmin);
            should.equal(typeof hasAdmin, 'boolean');
            should.equal(hasAdmin, false);
        });
    });

    describe('applySecurityFilter', () => {
        let query;

        beforeEach('', () => {
            query = {
                _id: '123',
                'stix.type': 'attack-pattern',
            }
            user = genUser();
        });

        it(`should apply security filter, and maintain existing query params`, () => {
            user.role = STANDARD_USER_ROLE;
            const filtered = SecurityHelper.applySecurityFilter(query, user);
            should.exist(filtered);
            should.equal(typeof filtered, 'object');
            should.equal(filtered._id, '123');
            should.equal(filtered['stix.type'], 'attack-pattern');
        });

        it(`should apply security filter for RUN_MODE === 'DEMO'`, () => {
            user.role = STANDARD_USER_ROLE;
            process.env.RUN_MODE = 'DEMO';
            const filtered = SecurityHelper.applySecurityFilter(query, user);
            should.exist(filtered);
            should.equal(typeof filtered, 'object');
            should.equal(filtered._id, '123');
            should.equal(filtered['stix.type'], 'attack-pattern');
            should.not.exist(filtered['stix.created_by_ref']);
        });

        it(`should apply security filter for undefined query`, () => {
            user.role = STANDARD_USER_ROLE;
            process.env.RUN_MODE = 'DEMO';
            const filtered = SecurityHelper.applySecurityFilter(undefined, user);
            should.not.exist(filtered);
        });

        it(`should apply security filter for RUN_MODE === 'UAC' and role ADMIN`, () => {
            user.role = ADMIN_ROLE;
            process.env.RUN_MODE = 'UAC';
            const filtered = SecurityHelper.applySecurityFilter(query, user);
            should.exist(filtered);
            should.equal(typeof filtered, 'object');
            should.equal(filtered._id, '123');
            should.equal(filtered['stix.type'], 'attack-pattern');
            should.not.exist(filtered['stix.created_by_ref']);
        });

        it(`should apply security filter for RUN_MODE === 'UAC' and role STANDARD_USER`, () => {
            user.role = STANDARD_USER_ROLE;
            process.env.RUN_MODE = 'UAC';
            const filtered = SecurityHelper.applySecurityFilter(query, user);
            should.exist(filtered);
            should.equal(typeof filtered, 'object');
            should.equal(filtered._id, '123');
            should.equal(filtered['stix.type'], 'attack-pattern');
            const filterPart = filtered['stix.created_by_ref'];
            should.exist(filterPart);
            should.exist(filterPart['$exists']);
            const orgIds = filterPart['$in'];
            should.exist(orgIds);
            should(orgIds.length).be.aboveOrEqual(1);
        });

        it(`should apply security filter and overwrite any given filter`, () => {
            user.role = STANDARD_USER_ROLE;
            process.env.RUN_MODE = 'UAC';
            query['stix.created_by_ref'] = {
                '$in': ['a', 'b', 'c', 'd']
            };
            const filtered = SecurityHelper.applySecurityFilter(query, user);
            should.exist(filtered);
            should.equal(typeof filtered, 'object');
            should.equal(filtered._id, '123');
            should.equal(filtered['stix.type'], 'attack-pattern');
            const filterPart = filtered['stix.created_by_ref'];
            should.exist(filterPart);
            should.exist(filterPart['$exists']);
            const orgIds = filterPart['$in'];
            should.exist(orgIds);
            should(orgIds.length).be.aboveOrEqual(1);
        });
    });
});