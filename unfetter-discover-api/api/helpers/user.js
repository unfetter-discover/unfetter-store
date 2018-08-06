const getAvatarUrl = user => {
    if (user && user.auth && user.auth.avatar_url) {
        return user.auth.avatar_url;
    }

    // @deprecated
    // Support for legacy user model, can be deleted in the future
    if (user && user.oauth) {
        const oauth = user.oauth;
        if (user[oauth] && user[oauth].avatar_url) {
            return user[oauth].avatar_url;
        }
    }

    // @deprecated
    // Support for legacy user model, can be deleted in the future
    if (user.guthub && user.github.avatar_url) {
        return user.github.avatar_url;
    }
    return null;
};

module.exports = {
    getAvatarUrl
};
