const GitlabStrategy = require('passport-gitlab').Strategy;

(() => ({

    build: (config, env) => {
        const gitlabStrategy = new GitlabStrategy(
            {
                ...config.gitlab,
                callbackURL: `${(env.API_ROOT || 'https://localhost/api')}/auth/gitlab-callback`
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
    },

    options: () => null,

    search: user => ({ 'gitlab.id': user.id }),

    sync: (user, gitlabInfo, approved) => {
        user.oauth = 'gitlab';
        user.approved = approved;
        if (!user.gitlab) {
            user.gitlab = {
                id: gitlabInfo.id,
                userName: null,
                avatar: null,
            };
        }
        user.gitlab.userName = gitlabInfo.username;
        if (gitlabInfo._json.avatar_url) {
            user.gitlab.avatar_url = gitlabInfo._json.avatar_url;
        }
    },

}))();
