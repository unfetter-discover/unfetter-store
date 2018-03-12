const lodash = require('lodash');

const transform = function transformFun(obj, type, urlRoot) {
    if (!(obj instanceof Object)) {
        obj = obj.toObject();
    }
    const apiObj = {
        type,
        id: obj.id,
        attributes: obj,
        links: {
            self: `${urlRoot}/${obj.id}`
        }
    };
    // delete apiObj.attributes._id;
    // delete apiObj.attributes.__v;
    return apiObj;
};

const convertJsonToJsonApi = function convertFunc(obj, type, urlRoot) {
    if (Array.isArray(obj)) {
        return lodash.map(obj, (item) => transform(item, type, urlRoot));
    } else if (typeof obj === 'object') {
        return transform(obj, type, urlRoot);
    }

    return null;
};

module.exports = {
    convertJsonToJsonApi
};
