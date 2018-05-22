const GitlabStrategy = require('passport-gitlab').Strategy;

module.exports = {

    build: function(config, env) {
        console.log('building gitlab strategy using', config, 'and', env);
        const gitlabStrategy = new GitlabStrategy({
            clientID: config.clientID,
            clientSecret: config.clientSecret,
            callbackURL: config.callbackURL
        }, (accessToken, refreshToken, profile, cb) => {
            return cb(null, profile);
        });
        if (env.HTTPS_PROXY_URL && (env.HTTPS_PROXY_URL !== '')) {
            console.log('Attempting to configure proxy');
            const HttpsProxyAgent = require('https-proxy-agent');
            gitlabStrategy._oauth2.setAgent(new HttpsProxyAgent(env.HTTPS_PROXY_URL));
        } else {
            console.log('Not using a proxy');
        }
        return gitlabStrategy;
    },

};
