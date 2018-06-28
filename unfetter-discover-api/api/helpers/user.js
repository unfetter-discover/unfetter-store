const getAvatarUrl = user => {
    if (user && user.oauth) {
        const oauth = user.oauth;
        if (user[oauth] && user[oauth].avatar_url) {
            return user[oauth].avatar_url;
        }
    }
    // Support for legacy user model, can be deleted in the future
    if (user.guthub && user.guthub.avatar_url) {
        return user.guthub.avatar_url;
    }
    return null;
};

module.exports = {
    getAvatarUrl
};
