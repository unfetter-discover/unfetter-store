const AuthHelper = require('../helpers/auth_helpers').AuthHelper;
const LdapStrategy = require('passport-ldapauth');
const fs = require('fs');

/**
 * To use, the private-config.json file should contain an ldap property object with the ldapauth-fork options:
 * url: The 'ldap://host:389' or 'ldaps://host:636' uri.
 * (opt.) bindDN: such as 'cn=root'
 * (opt.) bindCredentials: password for the bindDN
 * (opt.) truststore: 'path/to/root_ca_cert.crt' needed for LDAPS searches
 * (opt.) searchBase: the base DN from which to search for users by username, such as ou=users,o=example.com
 * (opt.) searchFilter: the LDAP search filter for finding a user by username, such as (uid={{username}})
 * (opt.) authOptions: authentication options, allows for overrides for the LDAP error messages
 */
class LdapAuth extends AuthHelper {

    constructor() {
        super('ldap');
        this.redirects = true;
        this.authOptions = {};
    }

    build(config) {
        const options = config && config.ldap ? { server: { ...config.ldap } } : {};
        if (options.authOptions) {
            this.authOptions = options.authOptions;
            delete options.authOptions;
        }
        options.server.searchAttributes = undefined; // return everything
        if (options.server.truststore) {
            options.server.tlsOptions = {
                ca: [fs.readFileSync(options.truststore)]
            };
            delete options.server.truststore;
        }
        return new LdapStrategy(options);
    }

    options() {
        return this.authOptions;
    }

    sync(data, ldapInfo, approved) {
        const user = data;
        super.sync(user, ldapInfo, approved);
        user.auth.service = 'ldap';
        user.auth.userName = ldapInfo.username;
        user.auth.marking_refs = [];
    }

}

(() => new LdapAuth())();
