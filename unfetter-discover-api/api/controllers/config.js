const BaseController = require('./shared/basecontroller');
const modelFactory = require('./shared/modelFactory');
const parser = require('../helpers/url_parser');
const jsonApiConverter = require('../helpers/json_api_converter');
const uuid = require('uuid');
const lodash = require('lodash');

const model = modelFactory.getModel('config');
const controller = new BaseController('config');
const apiRoot = process.env.API_ROOT || 'https://localhost/api';

module.exports = {
    get: (req, res) => {
        res.header('Content-Type', 'application/vnd.api+json');

        const query = parser.dbQueryParams(req);
        if (query.error) {
            return res.status(400).json({
                errors: [{
                    status: 400, source: '', title: 'Error', code: '', detail: query.error
                }]
            });
        }

        model
            .find(Object.assign({}, query.filter))
            .sort(query.sort)
            .limit(query.limit)
            .skip(query.skip)
            .exec((err, result) => {
                if (err) {
                    return res.status(500).json({
                        errors: [{
                            status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                        }]
                    });
                }


                const requestedUrl = apiRoot + req.originalUrl;
                const convertedResult = result
                    .map(response => response.toObject())
                    .map(response => {
                        const retVal = {};
                        retVal.links = {};
                        retVal.links.self = `${requestedUrl}/${response._id}`;
                        retVal.attributes = response;
                        retVal.attributes.id = response._id;
                        return retVal;
                    });
                return res.status(200).json({ links: { self: requestedUrl }, data: convertedResult });
            });
    },
    add: (req, res) => {
        res.header('Content-Type', 'application/vnd.api+json');
        let obj = {};
        if (req.swagger.params.data !== undefined && req.swagger.params.data.value.data.attributes !== undefined) {
            const data = req.swagger.params.data.value.data;
            // TODO need to put this in a get/try in case these values don't exist
            obj = data.attributes;
            if (obj._id === undefined) {
                obj._id = uuid.v4();
            }
            const newDocument = new model(obj);

            const error = newDocument.validateSync();
            if (error) {
                const errors = [];
                lodash.forEach(error.errors, field => {
                    errors.push(field.message);
                });
                return res.status(400).json({
                    errors: [{
                        status: 400, source: '', title: 'Error', code: '', detail: errors
                    }]
                });
            }

            model.create(newDocument, (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        errors: [{
                            status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                        }]
                    });
                }

                const requestedUrl = apiRoot + req.originalUrl;
                return res.status(201).json({ links: { self: `${requestedUrl}/${result._id}`, }, id: result._id, data: { attributes: result } });
            });
        } else {
            return res.status(400).json({
                errors: [{
                    status: 400, source: '', title: 'Error', code: '', detail: 'malformed request'
                }]
            });
        }
    },
    getById: controller.getByIdCb((err, result, req, res, id) => {
        if (err) {
            return res.status(500).json({
                errors: [{
                    status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                }]
            });
        }

        if (result && result.length === 1) {
            const requestedUrl = apiRoot + req.originalUrl;
            const convertedResult = jsonApiConverter.convertJsonToJsonApi(result[0], 'config', requestedUrl);
            return res.status(200).json({ links: { self: requestedUrl, }, data: convertedResult });
        }

        return res.status(404).json({ message: `No item found with id ${id}` });
    }),
    deleteById: (req, res) => {
        res.header('Content-Type', 'application/vnd.api+json');

        const id = req.swagger.params.id ? req.swagger.params.id.value : '';
        model.findOneAndRemove({ _id: id }, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            } else if (!result) {
                return res.status(404).json({ message: `Unable to delete the item.  No item found with id ${id}` });
            }
            return res.status(200).json({ data: { type: 'Success', message: `Deleted id ${id}` } });
        });
    },
    update: (req, res) => {
        res.header('Content-Type', 'application/vnd.api+json');

        // get the old item
        if (req.swagger.params.id.value !== undefined && req.swagger.params.data !== undefined && req.swagger.params.data.value.data.attributes !== undefined) {
            const id = req.swagger.params.id ? req.swagger.params.id.value : '';
            model.findById({ _id: id }, (err, result) => {
                if (err) {
                    return res.status(500).json({
                        errors: [{
                            status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                        }]
                    });
                } else if (!result) {
                    return res.status(500).json({
                        errors: [{
                            status: 500, source: '', title: 'Error', code: '', detail: 'Item not found'
                        }]
                    });
                }

                // set the new values
                const resultObj = result.toObject();
                const obj = req.swagger.params.data ? req.swagger.params.data.value.data.attributes : {};
                const has = Object.prototype.hasOwnProperty;
                for (const key in obj) {
                    if (has.call(obj, key)) {
                        resultObj[key] = obj[key];
                    }
                }

                // then validate
                // guard
                const newDocument = new model(resultObj);
                const error = newDocument.validateSync();
                if (error) {
                    const errors = [];
                    lodash.forEach(error.errors, field => {
                        errors.push(field.message);
                    });
                    return res.status(400).json({
                        errors: [{
                            status: 400, source: '', title: 'Error', code: '', detail: errors
                        }]
                    });
                }

                // guard pass complete
                model.findOneAndUpdate({ _id: id }, newDocument, { new: true }, (errUpdate, resultUpdate) => {
                    if (errUpdate) {
                        return res.status(500).json({
                            errors: [{
                                status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                            }]
                        });
                    }

                    if (resultUpdate) {
                        const requestedUrl = apiRoot + req.originalUrl;
                        return res.status(200).json({ links: { self: `${requestedUrl}/${resultUpdate._id}`, }, id: resultUpdate._id, data: { attributes: resultUpdate } });
                    }

                    return res.status(404).json({ message: `Unable to update the item.  No item found with id ${id}` });
                });
            });
        } else {
            return res.status(400).json({
                errors: [{
                    status: 400, source: '', title: 'Error', code: '', detail: 'malformed request'
                }]
            });
        }
    }
};
