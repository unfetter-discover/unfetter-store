const GitlabStrategy = require('passport-gitlab').Strategy;
const AuthHelper = require('../helpers/auth_helpers').AuthHelper;

class GitlabAuth extends AuthHelper {

    constructor() {
        super('gitlab');
    }

    /**
     * Builds a Gitlab passport strategy with the given configuration. Note that it uses passport-gitlab, not passport-gitlab2.
     *
     * Options include:
     * - clientID and clientSecret: You set these up in GitHub, under your Settings/Developer Settings tab.
     * - scope: Permission scopes on the request. You shouldn't need this.
     * - baseURL: Unlike the GitHub strategy, the Gitlab strategy lets you point to a custom Gitlab pretty easily. By default, points to the public
     *       Gitlab instance.
     * - authorizationURL: The relative path from the base URL for authentication (oauth/authorize). You shouldn't need to touch this.
     * - tokenURL: The relative path from the base URL for tokenizing (oath/token). You shouldn't need to touch this.
     * - profileURL: The relative path from the base URL for the user's profile (api/v4/user). You shouldn't need to touch this.
     *
     * It is unfortunate that the passport OAuth2 module does not take into account the possibility of needing authentication when contacting a
     * custom Gitlab endpoint. The only way around this appears to be by copying and modifying oauth2.js inside node-auth, and adding them to the
     * request options in the _request() method (https://github.com/ciaranj/node-auth, lib/oauth2.js, ~ line 112), then injecting the modified
     * code into your node_modules directory. For this reason, we've added that modified oauth2.js file in this directory, and suggest setting a
     * flag in the Unfetter Ansible deployment to move this file into the appropriate path of the docker container.
     */
    build(config, env) {
        const gitlabStrategy = new GitlabStrategy(
            {
                ...config.gitlab,
                callbackURL: `${config.apiRoot}/auth/gitlab-callback`
            },
            (accessToken, refreshToken, profile, cb) => cb(null, profile)
        );
        if (env.HTTPS_PROXY_URL && (env.HTTPS_PROXY_URL !== '')) {
            console.log('Attempting to configure proxy');
            const HttpsProxyAgent = require('https-proxy-agent');
            gitlabStrategy._oauth2.setAgent(new HttpsProxyAgent(env.HTTPS_PROXY_URL));
        } else {
            console.log('Not using a proxy');
        }
        return gitlabStrategy;
    }

    search(user) {
        return { 'auth.service': 'gitlab', 'auth.id': user.id };
    }

    sync(data, gitlabInfo, approved) {
        const user = data;
        super.sync(user, gitlabInfo, approved);
        user.auth.service = 'gitlab';
        user.auth.userName = gitlabInfo.username;
        user.auth.marking_refs = [];
        if (gitlabInfo._json.avatar_url) {
            user.auth.avatar_url = gitlabInfo._json.avatar_url;
        }
    }

}

(() => new GitlabAuth())();
