const GithubStrategy = require('passport-github').Strategy;
const AuthHelper = require('../helpers/auth_helpers').AuthHelper;

class GithubAuth extends AuthHelper {

    constructor() {
        super('github');
    }

    /**
     * Builds a GitHub passport strategy with the given configuration. Note that it uses passport-github, not passport-github2.
     *
     * Options include:
     * - clientID and clientSecret: You set these up in GitHub, under your Settings/Developer Settings tab.
     * - scope: Permission scopes on the request. You shouldn't need this, since the only thing Unfetter really needs is to authenticate, and if the
     *       user grants access to their profile, all we look for is an avatar to display.
     * - userAgent: If the API request needs to include a User Agent string. You probably won't need this.
     * - authorizationURL: The URL for GitHub. You only need this if you have your own GitHub instance; otherwise, it goes out to the public GitHub
     *       repo (https://github.com/login/oauth/authorize).
     * - tokenURL: Unfortunately, if you have to override the authorizationURL option, you will also have to override this one. The default is
     *       https://github.com/login/oath/access_token.
     * - customHeaders: Any special headers you need to pass through to the OAuth module (can include "User-Agent" mentioned above).
     *
     * DO NOT SET the callbackURL. This property tells GitHub where to redirects after authenticating you. This option is set for you, as it points
     * to Unfetter's own callback endpoint.
     *
     * It is unfortunate that the passport OAuth2 module does not take into account the possibility of needing authentication when contacting a
     * custom GitHub endpoint. The only way around this appears to be by copying and modifying oauth2.js inside node-auth, and adding them to the
     * request options in the _request() method (https://github.com/ciaranj/node-auth, lib/oauth2.js, ~ line 112), then injecting the modified
     * code into your node_modules directory. For this reason, we've added that modified oauth2.js file in this directory, and suggest setting a
     * flag in the Unfetter Ansible deployment to move this file into the appropriate path of the docker container.
     */
    build(config, env) {
        const githubStrategy = new GithubStrategy(
            {
                ...config.github,
                callbackURL: `${config.apiRoot}/auth/github-callback`
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
        return { 'auth.service': 'github', 'auth.id': user.id };
    }

    sync(data, githubInfo, approved) {
        const user = data;
        super.sync(user, githubInfo, approved);
        user.auth.service = 'github';
        user.auth.userName = githubInfo.username;
        user.auth.marking_refs = [];
        if (githubInfo._json.avatar_url) {
            user.auth.avatar_url = githubInfo._json.avatar_url;
        }
    }

}

(() => new GithubAuth())();
