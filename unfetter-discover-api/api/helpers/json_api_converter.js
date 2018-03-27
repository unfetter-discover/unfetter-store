const lodash = require('lodash');

const transform = function transformFun(obj, type, urlRoot) {
    let localObj = obj;
    if (!(obj instanceof Object)) {
        localObj = obj.toObject();
    }
    const apiObj = {
        type,
        id: localObj.id,
        attributes: localObj,
        links: {
            self: `${urlRoot}/${localObj.id}`
        }
    };
    // delete apiObj.attributes._id;
    // delete apiObj.attributes.__v;
    return apiObj;
};

const convertJsonToJsonApi = function convertFunc(obj, type, urlRoot) {
    if (Array.isArray(obj)) {
        return lodash.map(obj, item => transform(item, type, urlRoot));
    } else if (typeof obj === 'object') {
        return transform(obj, type, urlRoot);
    }

    return null;
};

module.exports = {
    convertJsonToJsonApi
};
