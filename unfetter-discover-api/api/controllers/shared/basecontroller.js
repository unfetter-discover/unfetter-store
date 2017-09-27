const mongoose = require('mongoose');
const lodash = require('lodash');
const stix = require('../../helpers/stix');
const jsonApiConverter = require('../../helpers/json_api_converter');
const parser = require('../../helpers/url_parser');
const modelFactory = require('./modelFactory');

const apiRoot = 'https://localhost/api';

module.exports = class BaseController {
    constructor(type) {
        this.type = type;
        this.model = modelFactory.getModel(type);      
    }

    getEnhancedData(result, swaggerParams) {
        let data;
        // No params present
        if (swaggerParams.extendedproperties === undefined && swaggerParams.metaproperties === undefined) {
            return result
                .map(res => res.toObject())
                .map(res => res.stix);
        }

        // no extended or meta properties
        if (swaggerParams.extendedproperties !== undefined && swaggerParams.extendedproperties.value !== undefined && swaggerParams.extendedproperties.value === false && (swaggerParams.metaproperties !== undefined && swaggerParams.metaproperties.value === undefined || swaggerParams.metaproperties.value === false)) {
            data = result
                .map(res => res.toObject())
                .map(res => res.stix);

        // both extended and meta properties
        } else if ((swaggerParams.extendedproperties !== undefined && swaggerParams.extendedproperties.value === undefined || swaggerParams.extendedproperties.value === true) && swaggerParams.metaproperties !== undefined && swaggerParams.metaproperties.value !== undefined && swaggerParams.metaproperties.value === true){
            data = result
                .map(res => res.toObject())
                .map(res => {
                    let temp = res.stix;
                    if (res.extendedProperties !== undefined) {
                        temp = {...temp, ...res.extendedProperties};
                    } 
                    if (res.metaProperties !== undefined) {
                        temp = { ...temp, ...res.metaProperties };
                    } 
                    return temp;
                });

        // Exteded properties only
        } else if (((swaggerParams.extendedproperties !== undefined && swaggerParams.extendedproperties.value === undefined) || swaggerParams.extendedproperties.value === true) && (swaggerParams.metaproperties !== undefined && swaggerParams.metaproperties.value === undefined || swaggerParams.metaproperties.value === false)) {
            data = result
                .map(res => res.toObject())
                .map(res => {
                    if (res.extendedProperties !== undefined) {
                        return { ...res.stix, ...res.extendedProperties };
                    } else {
                        return res.stix;
                    }
                });

        // Meta properties only
        } else if (swaggerParams.extendedproperties !== undefined && swaggerParams.extendedproperties.value !== undefined && swaggerParams.extendedproperties.value === false && swaggerParams.metaproperties !== undefined && swaggerParams.metaproperties.value !== undefined && swaggerParams.metaproperties.value === true) {
            data = result
                .map(res => res.toObject())
                .map(res => {
                    if (res.metaProperties !== undefined) {
                        return { ...res.stix, ...res.metaProperties };
                    } else {
                        return res.stix;
                    }
                });

        // Delete this if this function works!
        } else {
            console.log('DOOOOM!!!! This block should never be reached.');
        }
        return data;
    }

    aggregate() {
        const type = this.type;
        const model = this.model;
        return (req, res) => {
            res.header('Content-Type', 'application/vnd.api+json');

            const query = parser.dbQueryParams(req);
            if (query.error) {
                return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: query.error }] });
            }

            model
                .aggregate(query.aggregations)
                .exec((err, result) => {

                    if (err) {
                        return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
                    }

                    const requestedUrl = apiRoot + req.originalUrl;
                    const convertedResult = jsonApiConverter.convertJsonToJsonApi(result, type, requestedUrl);
                    return res.status(200).json({ links: { self: requestedUrl, }, data: convertedResult });
                });
        }
    }

    get() {
        const type = this.type;
        const model = this.model;
        const getEnhancedData = this.getEnhancedData;
        return (req, res) => {
            res.header('Content-Type', 'application/vnd.api+json');

            const query = parser.dbQueryParams(req);
            if (query.error) {
                return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: query.error }] });
            }

            model
                .find(Object.assign({'stix.type': type}, query.filter))
                .sort(query.sort)
                .limit(query.limit)
                .skip(query.skip)
                .exec((err, result) => {

                    if (err) {
                        return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
                    }

                    const requestedUrl = apiRoot + req.originalUrl;

                    let data = getEnhancedData(result, req.swagger.params);                    

                    const convertedResult = jsonApiConverter.convertJsonToJsonApi(data, type, requestedUrl);
                    return res.status(200).json({ links: { self: requestedUrl, }, data: convertedResult });
                });
        }
    }

    getById() {
        const type = this.type;
        const model = this.model;
        const getEnhancedData = this.getEnhancedData;
        return this.getByIdCb((err, result, req, res, id) => {
            if (err) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            }

            if (result && result.length === 1) {
                const requestedUrl = apiRoot + req.originalUrl;

                let data = getEnhancedData(result, req.swagger.params);
                
                const convertedResult = jsonApiConverter.convertJsonToJsonApi(data[0], type, requestedUrl);
                return res.status(200).json({ links: { self: requestedUrl, }, data: convertedResult });
            }

            return res.status(404).json({ message: `No item found with id ${id}` });
        });
    }

    getByIdCb(callback) {
        const type = this.type;
        const model = this.model;
        return (req, res) => {
            res.header('Content-Type', 'application/vnd.api+json');

            const id = req.swagger.params.id ? req.swagger.params.id.value : '';

            // get the most recent one since there could be many with the same id
            // stix most recent is defined as the most recently modified one
            model
                .find({ _id: id })
                .sort({ modified: '-1' })
                .limit(1)
                .exec((err, result) => {
                    callback(err, result, req, res, id);
                });
        }
    }

    add() {
        const type = this.type;
        const model = this.model;
        return (req, res) => {
            res.header('Content-Type', 'application/vnd.api+json');
            const obj = {};
            if (req.swagger.params.data !== undefined && req.swagger.params.data.value.data.attributes !== undefined) {
                const data = req.swagger.params.data.value.data;
                    // TODO need to put this in a get/try in case these values don't exist
                obj.stix = data.attributes;
                if (data.type !== undefined) {
                    obj.stix.type = data.type;
                } else {
                    obj.stix.type = this.type;
                }
                obj.stix.id = stix.id(obj.stix.type);

                // Process extended properties
                let extendedProperties = {};
                for(let prop of Object.keys(data.attributes)) {
                    if(prop.match(/^x_/) !== null) {
                        extendedProperties[prop] = data.attributes[prop];
                        delete obj.stix[prop];
                    }
                }
                if(Object.keys(extendedProperties).length > 0) {
                    obj.extendedProperties = extendedProperties;
                }

                const newDocument = new model(obj);

                const error = newDocument.validateSync();
                if (error) {
                    const errors = [];
                    lodash.forEach(error.errors, (field) => {
                        errors.push(field.message);
                    });
                    return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: errors }] });
                }

                newDocument._id = newDocument.stix.id;

                model.create(newDocument, (err, result) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
                    }
                    const requestedUrl = apiRoot + req.originalUrl;
                    const convertedResult = jsonApiConverter.convertJsonToJsonApi([
                            result.extendedProperties !== undefined ? { ...result.stix, ...result.extendedProperties } : result.stix
                        ], type, requestedUrl);

                    return res.status(201).json({ links: { self: requestedUrl, }, data: convertedResult });
                });
            } else {
                return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'malformed request' }] });
            }            
        };
    }

    update() {
        const type = this.type;
        const model = this.model;
        return (req, res) => {
            res.header('Content-Type', 'application/vnd.api+json');

            // get the old item
            if (req.swagger.params.id.value !== undefined && req.swagger.params.data !== undefined && req.swagger.params.data.value.data.attributes !== undefined) {
                const id = req.swagger.params.id ? req.swagger.params.id.value : '';
                model.findById({ _id: id }, (err, result) => {
                    if (err) {
                    return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
                    }

                    // set the new values
                    const resultObj = result.toObject();
                    const incomingObj = req.swagger.params.data ? req.swagger.params.data.value.data.attributes : {};
                    const has = Object.prototype.hasOwnProperty;
                    for (const key in incomingObj) {
                        if (key.match(/^x_/) === null && has.call(incomingObj, key)) {
                            resultObj.stix[key] = incomingObj[key];
                        } else if (key.match(/^x_/) !== null && has.call(incomingObj, key)) {
                            if (resultObj.extendedProperties === undefined) {
                                resultObj.extendedProperties = {};
                            }
                            resultObj.extendedProperties[key] = incomingObj[key];
                        }
                    }

                    // then validate
                    // guard
                    resultObj.stix.modified = new Date();
                    const newDocument = new model(resultObj);
                    const error = newDocument.validateSync();
                    if (error) {
                    const errors = [];
                    lodash.forEach(error.errors, (field) => {
                        errors.push(field.message);
                    });
                    return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: errors }] });
                    }

                    // guard pass complete
                    model.findOneAndUpdate({ _id: id }, newDocument, { new: true }, (errUpdate, resultUpdate) => {
                    if (errUpdate) {
                        return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
                    }

                    if (resultUpdate) {
                        let resObj = resultUpdate.toObject();
                        const requestedUrl = apiRoot + req.originalUrl;
                        const convertedResult = jsonApiConverter.convertJsonToJsonApi(resObj.extendedProperties !== undefined ? { ...resObj.stix, ...resObj.extendedProperties } : resObj.stix, type, requestedUrl);
                        return res.status(200).json({ links: { self: requestedUrl, }, data: convertedResult });
                    }

                    return res.status(404).json({ message: `Unable to update the item.  No item found with id ${id}` });
                    });
                });
            } else {
                return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'malformed request' }] });
            }  
        };
    }

    deleteById() {
        const type = this.type;
        const model = this.model;
        const relationshipModel = modelFactory.getModel('relationship');
        return (req, res) => {
            res.header('Content-Type', 'application/vnd.api+json');

            const id = req.swagger.params.id ? req.swagger.params.id.value : '';

            const promises = [];
            // per mongo documentation
            // Mongoose queries are not promises. However, they do have a .then() function for yield and async/await.
            // If you need a fully- fledged promise, use the .exec() function.
            promises.push(model.remove({ _id: id }).exec());
            promises.push(relationshipModel.remove({ $or: [{ source_ref: id }, { target_ref: id }] }).exec());
            Promise.all(promises).then((response) => {
                if (response && response.length > 0 && response[0].result && response[0].result.n === 1) {
                    return res.status(200).json({ data: { type: 'Success', message: `Deleted id ${id}` } });
                }

                return res.status(404).json({ message: `Unable to delete the item.  No item found with id ${id}` });
            }).catch((err) => {
                res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            });
        };
    } 
}