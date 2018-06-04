const GithubStrategy = require('passport-github').Strategy;
const AuthHelper = require('../helpers/auth_helpers').AuthHelper;

class GithubAuth extends AuthHelper {

    constructor() {
        super('github');
    }

    build(config, env) {
        const githubStrategy = new GithubStrategy(
            {
                ...config.github,
                callbackURL: `${(env.API_ROOT || 'https://localhost/api')}/auth/github-callback`
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
    }

    options() {
        return { scope: ['user:email'] };
    }

    search(user) {
        return { 'github.id': user.id };
    }

    sync(user, githubInfo, approved) {
        super.sync(user, githubInfo, approved);
        user.github.userName = githubInfo.username;
        if (githubInfo._json.avatar_url) {
            user.github.avatar_url = githubInfo._json.avatar_url;
        }
    }

}

(() => new GithubAuth())();
