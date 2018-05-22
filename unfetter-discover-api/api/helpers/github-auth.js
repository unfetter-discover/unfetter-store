const GithubStrategy = require('passport-github').Strategy;

module.exports = {

    build: function(config, env) {
        console.log('building github strategy using', config, 'and', env);
        const githubStrategy = new GithubStrategy({
                clientID: config.github.clientID,
                clientSecret: config.github.clientSecret,
                callbackURL: (env.API_ROOT || 'https://localhost/api') + '/auth/loginSuccess'
            }, (accessToken, refreshToken, profile, callback) => {
                return callback(null, profile);
            }
        );
        if (env.HTTPS_PROXY_URL && (env.HTTPS_PROXY_URL !== '')) {
            console.log('Attempting to configure proxy');
            const HttpsProxyAgent = require('https-proxy-agent');
            githubStrategy._oauth2.setAgent(new HttpsProxyAgent(env.HTTPS_PROXY_URL));
        } else {
            console.log('Not using a proxy');
        }
        console.log('returning', githubStrategy);
        return githubStrategy;
    },

};
