const GitlabStrategy = require('passport-gitlab').Strategy;

module.exports = {

    build: function(config, env) {
        const gitlabStrategy = new GitlabStrategy({
                ...config.gitlab,
                callbackURL: (env.API_ROOT || 'https://localhost/api') + '/auth/login/gitlab/callback'
            },
            (accessToken, refreshToken, profile, cb) => cb(null, profile));
        if (env.HTTPS_PROXY_URL && (env.HTTPS_PROXY_URL !== '')) {
            console.log('Attempting to configure proxy');
            const HttpsProxyAgent = require('https-proxy-agent');
            gitlabStrategy._oauth2.setAgent(new HttpsProxyAgent(env.HTTPS_PROXY_URL));
        } else {
            console.log('Not using a proxy');
        }
        return gitlabStrategy;
    },

    options: {},

    search: (user) => ({ 'gitlab.id': user.id }),

    sync: (storedUser, userinfo, approved) => {
        storedUser.oauth = 'gitlab';
        if (!storedUser.gitlab) {
            storedUser.gitlab = {
                id: userinfo.id,
                userName: null,
                avatar: null,
            };
        }
        storedUser.approved = approved;
        storedUser.gitlab.userName = userinfo.username;
        if (userinfo._json.avatar_url) {
            storedUser.gitlab.avatar_url = userinfo._json.avatar_url;
        }
        if (!storedUser.identity) {
            storedUser.identity = {name: userinfo.username};
        }
        if (!storedUser.email && userinfo.emails && userinfo.emails.length) {
            storedUser.email = userinfo.emails[0].value;
        }
    },

};
