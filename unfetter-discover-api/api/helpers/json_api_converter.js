const lodash = require('lodash');

const transform = (obj, type, urlRoot) => {
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
    return apiObj;
};

const convertJsonToJsonApi = (obj, type, urlRoot) => {
    if (Array.isArray(obj)) {
        return lodash.map(obj, item => transform(item, type, urlRoot));
    } else if (typeof obj === 'object') {
        return transform(obj, type, urlRoot);
    }

    return null;
};

module.exports = {
    convertJsonToJsonApi,
    transform
};
