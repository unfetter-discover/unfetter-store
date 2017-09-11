const BaseController = require('./shared/basecontroller');
const modelFactory = require('./shared/modelFactory');
const parser = require('../helpers/url_parser');

const apiRoot = 'https://localhost/api';
const model = modelFactory.getModel('schemaless');

const transform = function transformFun(obj, urlRoot) {
    obj = obj.toObject().stix;
    const apiObj = {
        type: obj.type,
        id: obj.id,
        attributes: obj,
        links: {
            self: `${urlRoot}/${obj._id}`
        }
    };
    // delete apiObj.attributes._id;
    // delete apiObj.attributes.__v;
    return apiObj;
};

module.exports = {
    get: (req, res) => {
        res.header('Content-Type', 'application/vnd.api+json');

        const query = parser.dbQueryParams(req);
        if (query.error) {
            return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: query.error }] });
        }

        model
            .find(query.filter)
            .sort(query.sort)
            .limit(query.limit)
            .skip(query.skip)
            .exec((err, result) => {

                if (err) {
                    return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
                }

                const requestedUrl = apiRoot + req.originalUrl;
                const convertedResult = result.map(res => transform(res, requestedUrl));
                return res.status(200).json({ links: { self: requestedUrl, }, data: convertedResult });
            });
    }
    
};