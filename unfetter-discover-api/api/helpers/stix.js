const uuid = require('uuid');

const id = function idFunc(type) {
    const random = uuid.v4();
    return `${type}--${random}`;
};

module.exports = {
    id
};
