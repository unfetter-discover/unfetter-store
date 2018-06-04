const AuthHelper = require('../helpers/auth_helpers').AuthHelper;

class LdapAuth extends AuthHelper {

    search(user) {
        return { 'ldap.id': user.id };
    }

}

(() => new LdapAuth())();
