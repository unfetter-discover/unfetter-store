const GithubStrategy = require('passport-github').Strategy;

module.exports = {

    build: (config, env) => {
        const githubStrategy = new GithubStrategy(
            {
                ...config.github,
                callbackURL: `${(env.API_ROOT || 'https://localhost/api')}/auth/login/github/callback`
            },
            (accessToken, refreshToken, profile, callback) => callback(null, profile)
        );
        if (env.HTTPS_PROXY_URL && (env.HTTPS_PROXY_URL !== '')) {
            console.log('Attempting to configure proxy');
            const HttpsProxyAgent = require('https-proxy-agent');
            githubStrategy._oauth2.setAgent(new HttpsProxyAgent(env.HTTPS_PROXY_URL));
        } else {
            console.log('Not using a proxy');
        }
        return githubStrategy;
    },

    options: { scope: ['user:email'] },

    search: user => ({ 'github.id': user.id }),

    sync: (storedUser, userinfo, approved) => {
        storedUser.oauth = 'github';
        if (!storedUser.github) {
            storedUser.github = {
                id: userinfo.id,
                userName: null,
                avatar: null,
            };
        }
        storedUser.approved = approved;
        storedUser.github.userName = userinfo.username;
        if (userinfo._json.avatar_url) {
            storedUser.github.avatar_url = userinfo._json.avatar_url;
        }
    },

};
