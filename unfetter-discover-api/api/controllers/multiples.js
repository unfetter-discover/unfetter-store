const BaseController = require('./shared/basecontroller');
const modelFactory = require('./shared/modelFactory');
const parser = require('../helpers/url_parser');

const apiRoot = 'https://localhost/api';
const model = modelFactory.getModel('schemaless');

const transform = function transformFun(obj, urlRoot) {
    obj = { ...obj.toObject().stix, ...obj.toObject().metaProperties, ...obj.toObject };
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

const get = (req, res) => {
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
};

const addComment = (req, res) => {
    res.header('Content-Type', 'application/vnd.api+json');

    // get the old item
    if (req.swagger.params.id.value !== undefined 
        && req.swagger.params.data !== undefined 
        && req.swagger.params.data.value.data.attributes !== undefined
        && req.swagger.params.data.value.data.attributes.comment !== undefined) {

        const id = req.swagger.params.id ? req.swagger.params.id.value : '';
        const comment = req.swagger.params.data.value.data.attributes.comment;
        
        let user;
        if (process.env.RUN_MODE === 'DEMO') {
            user = {
                _id: '1234',
                userName: 'Demo-User',
                firstName: 'Demo',
                lastName: 'User'
            };
        } else {
            user = req.user
        }

        model.findById({ _id: id }, (err, result) => {
            if (err || !result) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            }
            const resultObj = result.toObject();
            if (resultObj.metaProperties === undefined) {
                resultObj.metaProperties = {};
            }

            if (resultObj.metaProperties.comments === undefined) {
                resultObj.metaProperties.comments = [];
            } 

            const commentObj = {
                "user": {
                    "id": user._id,
                    "userName": user.userName
                },
                "submitted": new Date(),
                "comment": comment
            };

            if (user.github && user.github.avatar_url) {
                commentObj['user']['avatar_url'] = user.github.avatar_url;
            }

            resultObj.metaProperties.comments.push(commentObj);

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
                    const requestedUrl = apiRoot + req.originalUrl;
                    const obj = newDocument.toObject();
                    return res.status(200).json({
                        links: { self: requestedUrl, },
                        data: { attributes: { ...obj.stix, ...obj.extendedProperties, metaProperties: obj.metaProperties } }
                    });
                }

                return res.status(404).json({ message: `Unable to update the item.  No item found with id ${id}` });
            });
           
        });
    } else {
        return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'malformed request' }] });
    }
};

const addLike = (req, res) => {
    res.header('Content-Type', 'application/vnd.api+json');

    // get the old item
    if (req.swagger.params.id.value !== undefined) {

        const id = req.swagger.params.id ? req.swagger.params.id.value : '';

        let user;
        if (process.env.RUN_MODE === 'DEMO') {
            user = {
                _id: '1234',
                userName: 'Demo-User',
                firstName: 'Demo',
                lastName: 'User'
            };
        } else {
            user = req.user
        }

        model.findById({ _id: id }, (err, result) => {
            if (err || !result) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            }
            const resultObj = result.toObject();
            if (resultObj.metaProperties === undefined) {
                resultObj.metaProperties = {};
            }

            if (resultObj.metaProperties.likes === undefined) {
                resultObj.metaProperties.likes = [];
            } else {
                const likedByUser = resultObj.metaProperties.likes
                    .find((like) => like.user.id.toString() === user._id.toString());

                if(likedByUser) {
                    return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'User has already liked this' }] });
                }
            }

            resultObj.metaProperties.likes.push({
                "user": {
                    "id": user._id,
                    "userName": user.userName
                },
                "submitted": new Date()
            });

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
                    const requestedUrl = apiRoot + req.originalUrl;
                    const obj = newDocument.toObject();
                    return res.status(200).json({
                        links: { self: requestedUrl, },
                        data: { attributes: { ...obj.stix, ...obj.extendedProperties, metaProperties: obj.metaProperties } }
                    });
                }

                return res.status(404).json({ message: `Unable to update the item.  No item found with id ${id}` });
            });

        });
    } else {
        return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'malformed request' }] });
    }
};

const removeLike = (req, res) => {
    res.header('Content-Type', 'application/vnd.api+json');

    if (req.swagger.params.id.value !== undefined) {

        const id = req.swagger.params.id ? req.swagger.params.id.value : '';

        let user;
        if (process.env.RUN_MODE === 'DEMO') {
            user = {
                _id: '1234',
                userName: 'Demo-User',
                firstName: 'Demo',
                lastName: 'User'
            };
        } else {
            user = req.user
        }

        model.findById({ _id: id }, (err, result) => {
            if (err || !result) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            }
            const resultObj = result.toObject();
            if (resultObj.metaProperties === undefined) {
                resultObj.metaProperties = {};
            }

            if (resultObj.metaProperties.likes === undefined) {
                resultObj.metaProperties.likes = [];
            } else {
                const likedByUser = resultObj.metaProperties.likes
                    .find((like) => like.user.id.toString() === user._id.toString());

                if (!likedByUser) {
                    return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'User has not liked this item' }] });
                }
            }

            resultObj.metaProperties.likes = resultObj.metaProperties.likes.filter((like) => like.user.id.toString() !== user._id.toString());

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
                    const requestedUrl = apiRoot + req.originalUrl;
                    const obj = newDocument.toObject();
                    return res.status(200).json({
                        links: { self: requestedUrl, },
                        data: { attributes: { ...obj.stix, ...obj.extendedProperties, metaProperties: obj.metaProperties } }
                    });
                }

                return res.status(404).json({ message: `Unable to update the item.  No item found with id ${id}` });
            });

        });
    } else {
        return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'malformed request' }] });
    }
};

const addLabel = (req, res) => {
    res.header('Content-Type', 'application/vnd.api+json');

    // get the old item
    if (req.swagger.params.id.value !== undefined
        && req.swagger.params.data !== undefined
        && req.swagger.params.data.value.data.attributes !== undefined
        && req.swagger.params.data.value.data.attributes.label !== undefined) {

        const id = req.swagger.params.id ? req.swagger.params.id.value : '';
        const newLabel = req.swagger.params.data.value.data.attributes.label;

        model.findById({ _id: id }, (err, result) => {
            if (err || !result) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            }
            const resultObj = result.toObject();
            if (resultObj.metaProperties === undefined) {
                resultObj.metaProperties = {};
            }

            if (resultObj.stix.labels === undefined) {
                resultObj.stix.labels = [];
            } else if (resultObj.stix.labels.includes(newLabel)) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'Label already exists' }] });
            }

            resultObj.stix.labels.push(newLabel);

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
                    const requestedUrl = apiRoot + req.originalUrl;
                    const obj = newDocument.toObject();
                    return res.status(200).json({
                        links: { self: requestedUrl, },
                        data: { attributes: { ...obj.stix, ...obj.extendedProperties, metaProperties: obj.metaProperties } }
                    });
                }

                return res.status(404).json({ message: `Unable to update the item.  No item found with id ${id}` });
            });

        });
    } else {
        return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'malformed request' }] });
    }
};

const addInteraction = (req, res) => {
    res.header('Content-Type', 'application/vnd.api+json');

    // get the old item
    if (req.swagger.params.id.value !== undefined) {

        const id = req.swagger.params.id ? req.swagger.params.id.value : '';
        const user = req.user;

        model.findById({ _id: id }, (err, result) => {
            if (err || !result) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            }
            const resultObj = result.toObject();
            if (resultObj.metaProperties === undefined) {
                resultObj.metaProperties = {};
            }

            if (resultObj.metaProperties.interactions === undefined) {
                resultObj.metaProperties.interactions = [];
            } else {
                const interactedByUser = resultObj.metaProperties.interactions
                    .find((interaction) => interaction.user.id.toString() === user._id.toString());

                if (interactedByUser) {
                    return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'User has already interacted with this' }] });
                }
            }

            resultObj.metaProperties.interactions.push({
                "user": {
                    "id": user._id,
                    "userName": user.userName
                },
                "submitted": new Date()
            });

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
                    const requestedUrl = apiRoot + req.originalUrl;
                    const obj = newDocument.toObject();
                    return res.status(200).json({
                        links: { self: requestedUrl, },
                        data: { attributes: { ...obj.stix, ...obj.metaProperties, ...obj.extendedProperties } }
                    });
                }

                return res.status(404).json({ message: `Unable to update the item.  No item found with id ${id}` });
            });

        });
    } else {
        return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: 'malformed request' }] });
    }
};

module.exports = {
    get,
    addComment,
    addLike,
    removeLike,
    addLabel,
    addInteraction
};
