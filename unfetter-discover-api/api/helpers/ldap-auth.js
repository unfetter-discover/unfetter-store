// const LDAPStrategy = require('passport-ldap').Strategy;

(() => ({

    build: (config, env) => {
        // const ldapStrategy = new LDAPStrategy(
        //     {
        //         ...config.ldap,
        //         callbackURL: `${(env.API_ROOT || 'https://localhost/api')}/auth/ldap-callback`
        //     },
        //     (accessToken, refreshToken, profile, callback) => callback(null, profile)
        // );
        // return ldapStrategy;
    },

    options: () => null,

    search: user => ({ 'ldap.id': user.id }),

    sync: (storedUser, userinfo, approved) => {
        // storedUser.oauth = 'ldap';
        // if (!storedUser.github) {
        //     storedUser.github = {
        //         id: userinfo.id,
        //         userName: null,
        //         avatar: null,
        //     };
        // }
        // storedUser.approved = approved;
        // storedUser.github.userName = userinfo.username;
        // if (userinfo._json.avatar_url) {
        //     storedUser.github.avatar_url = userinfo._json.avatar_url;
        // }
    },

}))();
