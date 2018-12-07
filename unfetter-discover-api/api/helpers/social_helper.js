const mongoose = require('mongoose');

const makeComment = (comment, userId) => {
    const commentObj = {
        _id: mongoose.Types.ObjectId(),
        user: {
            id: userId
        },
        submitted: new Date(),
        comment
    };

    return commentObj;
};

module.exports = {
    makeComment
};
