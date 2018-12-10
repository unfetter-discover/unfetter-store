const lodash = require('lodash');

const modelFactory = require('./shared/modelFactory');
const parser = require('../helpers/url_parser');
const SecurityHelper = require('../helpers/security_helper');
const socialHelper = require('../helpers/social_helper');
const jsonApiConverter = require('../helpers/json_api_converter');
const config = require('../config/config');

const apiRoot = config.apiRoot;
const model = modelFactory.getModel('schemaless');
const aggregationModel = modelFactory.getAggregationModel('stix');
const publishNotification = require('../controllers/shared/publish');

const get = (req, res) => {
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
        .find(SecurityHelper.applySecurityFilter(query.filter))
        .sort(query.sort)
        .limit(query.limit)
        .skip(query.skip)
        .select(query.project)
        .exec((err, result) => {
            if (err) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }

            const requestedUrl = apiRoot + req.originalUrl;
            const convertedResult = result.map(response => jsonApiConverter.transform(response, requestedUrl));
            return res.status(200).json({ links: { self: requestedUrl, }, data: convertedResult });
        });
};

const count = (req, res) => {
    const filter = req.swagger.params.filter && req.swagger.params.filter.value ? JSON.parse(req.swagger.params.filter.value) : {};

    // TODO apply security filter to this
    model
        .count(SecurityHelper.applySecurityFilter(filter, req.user), (err, countRes) => {
            if (err) {
                return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
            }
            return res.json({ data: { attributes: { count: countRes } } });
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
            user = req.user;
        }

        model.findById({ _id: id }, (err, result) => {
            if (err || !result) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }
            const resultObj = result.toObject();
            if (resultObj.metaProperties === undefined) {
                resultObj.metaProperties = {};
            }

            if (resultObj.metaProperties.comments === undefined) {
                resultObj.metaProperties.comments = [];
            }
            const commentObj = socialHelper.makeComment(comment, user._id);
            commentObj.replies = [];
            resultObj.metaProperties.comments.unshift(commentObj);

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
                    const obj = newDocument.toObject();

                    // Notify user if its another user leaving a comment
                    if (req.user && req.user._id && obj.creator && req.user._id.toString() !== obj.creator.toString()) {
                        if (newDocument.stix.type === 'indicator') {
                            publishNotification.notifyUser(obj.creator, 'COMMENT', `${user.userName} commented on ${resultObj.stix.name}`, comment.slice(0, 100), `/indicator-sharing/single/${newDocument._id}`);
                        } else {
                            publishNotification.notifyUser(obj.creator, 'COMMENT', `${user.userName} commented on ${resultObj.stix.name}`, comment.slice(0, 100));
                        }
                    }

                    // Update comment for all, if stricter UAC is added, confirm comment is for Unfetter open before update all
                    publishNotification.updateSocialForAll('COMMENT', commentObj, resultObj._id);

                    return res.status(200).json({
                        links: { self: requestedUrl, },
                        data: { attributes: { ...obj.stix, ...obj.extendedProperties, metaProperties: obj.metaProperties } }
                    });
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
};

const addReply = (req, res) => {
    res.header('Content-Type', 'application/vnd.api+json');

    // get the old item
    if (req.swagger.params.id.value !== undefined &&
        req.swagger.params.data !== undefined &&
        req.swagger.params.data.value.data.attributes !== undefined &&
        req.swagger.params.data.value.data.attributes.reply !== undefined) {
        const id = req.swagger.params.id ? req.swagger.params.id.value : '';
        const commentId = req.swagger.params.commentId ? req.swagger.params.commentId.value : '';
        const reply = req.swagger.params.data.value.data.attributes.reply;

        let user;
        if (process.env.RUN_MODE === 'DEMO') {
            user = {
                _id: '1234',
                userName: 'Demo-User',
                firstName: 'Demo',
                lastName: 'User'
            };
        } else {
            user = req.user;
        }

        model.findById({
            _id: id
        }, (err, result) => {
            if (err || !result) {
                return res.status(500).json({
                    errors: [{
                        status: 500,
                        source: '',
                        title: 'Error',
                        code: '',
                        detail: 'An unknown error has occurred.'
                    }]
                });
            }
            const resultObj = result.toObject();
            if (resultObj.metaProperties === undefined) {
                resultObj.metaProperties = {};
            }

            if (resultObj.metaProperties.comments === undefined) {
                return res.status(404).json({
                    errors: [{
                        status: 404,
                        source: '',
                        title: 'Error',
                        code: '',
                        detail: 'This object does not have comments, thus it can not be the right id'
                    }]
                });
            }

            const foundComment = resultObj.metaProperties.comments.find(comment => comment._id.toString() === commentId);

            if (!foundComment) {
                return res.status(404).json({
                    errors: [{
                        status: 404,
                        source: '',
                        title: 'Error',
                        code: '',
                        detail: 'Can not find comment object'
                    }]
                });
            }

            const replyObj = socialHelper.makeComment(reply, user._id);
            if (!foundComment.replies) {
                foundComment.replies = [];
            }
            foundComment.replies.unshift(replyObj);

            const newDocument = new model(resultObj);
            const error = newDocument.validateSync();
            if (error) {
                const errors = [];
                lodash.forEach(error.errors, field => {
                    errors.push(field.message);
                });
                return res.status(400).json({
                    errors: [{
                        status: 400,
                        source: '',
                        title: 'Error',
                        code: '',
                        detail: errors
                    }]
                });
            }

            // guard pass complete
            model.findOneAndUpdate({
                _id: id
            }, newDocument, {
                new: true
            }, (errUpdate, resultUpdate) => {
                if (errUpdate) {
                    return res.status(500).json({
                        errors: [{
                            status: 500,
                            source: '',
                            title: 'Error',
                            code: '',
                            detail: 'An unknown error has occurred.'
                        }]
                    });
                }

                if (resultUpdate) {
                    const requestedUrl = apiRoot + req.originalUrl;
                    const obj = newDocument.toObject();

                    // TODO notify poster of comment
                    // Notify user if its another user leaving a reply
                    // if (req.user && req.user._id && obj.creator && req.user._id.toString() !== obj.creator.toString()) {
                    //     if (newDocument.stix.type === 'indicator') {
                    //         publishNotification.notifyUser(obj.creator, 'REPLY', `${user.userName} replied on ${resultObj.stix.name}`, reply.slice(0, 100), `/indicator-sharing/single/${newDocument._id}`);
                    //     } else {
                    //         publishNotification.notifyUser(obj.creator, 'REPLY', `${user.userName} replied on ${resultObj.stix.name}`, reply.slice(0, 100));
                    //     }
                    // }

                    // // Update reply for all, if stricter UAC is added, confirm reply is for Unfetter open before update all
                    publishNotification.updateSocialForAll('REPLY', { commentId, ...replyObj }, resultObj._id);

                    return res.status(200).json({
                        links: {
                            self: requestedUrl,
                        },
                        data: {
                            attributes: { ...obj.stix,
                                ...obj.extendedProperties,
                                metaProperties: obj.metaProperties
                            }
                        }
                    });
                }

                return res.status(404).json({
                    message: `Unable to update the item.  No item found with id ${id}`
                });
            });
        });
    } else {
        return res.status(400).json({
            errors: [{
                status: 400,
                source: '',
                title: 'Error',
                code: '',
                detail: 'malformed request'
            }]
        });
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
            user = req.user;
        }

        model.findById({ _id: id }, (err, result) => {
            if (err || !result) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }
            const resultObj = result.toObject();
            if (resultObj.metaProperties === undefined) {
                resultObj.metaProperties = {};
            }

            if (resultObj.metaProperties.likes === undefined) {
                resultObj.metaProperties.likes = [];
            } else {
                const likedByUser = resultObj.metaProperties.likes
                    .find(like => like.user.id.toString() === user._id.toString());

                if (likedByUser) {
                    return res.status(500).json({
                        errors: [{
                            status: 500, source: '', title: 'Error', code: '', detail: 'User has already liked this'
                        }]
                    });
                }
            }

            resultObj.metaProperties.likes.push({
                user: {
                    id: user._id,
                    userName: user.userName
                },
                submitted: new Date()
            });

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
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: 'malformed request'
            }]
        });
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
            user = req.user;
        }

        model.findById({ _id: id }, (err, result) => {
            if (err || !result) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }
            const resultObj = result.toObject();
            if (resultObj.metaProperties === undefined) {
                resultObj.metaProperties = {};
            }

            if (resultObj.metaProperties.likes === undefined) {
                resultObj.metaProperties.likes = [];
            } else {
                const likedByUser = resultObj.metaProperties.likes
                    .find(like => like.user.id.toString() === user._id.toString());

                if (!likedByUser) {
                    return res.status(500).json({
                        errors: [{
                            status: 500, source: '', title: 'Error', code: '', detail: 'User has not liked this item'
                        }]
                    });
                }
            }

            resultObj.metaProperties.likes = resultObj.metaProperties.likes.filter(like => like.user.id.toString() !== user._id.toString());

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
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: 'malformed request'
            }]
        });
    }
};

const publish = (req, res) => {
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
            user = req.user;
        }

        model.findById(SecurityHelper.applySecurityFilter({ _id: id }, user), (err, result) => {
            if (err || !result) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'Unable to find STIX document.'
                    }]
                });
            }
            const resultObj = result.toObject();
            if (resultObj.metaProperties === undefined) {
                resultObj.metaProperties = {};
            }

            resultObj.metaProperties.published = true;

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
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: 'malformed request'
            }]
        });
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
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }
            const resultObj = result.toObject();
            if (resultObj.metaProperties === undefined) {
                resultObj.metaProperties = {};
            }

            if (resultObj.stix.labels === undefined) {
                resultObj.stix.labels = [];
            } else if (resultObj.stix.labels.includes(newLabel)) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'Label already exists'
                    }]
                });
            }

            resultObj.stix.labels.push(newLabel);
            resultObj.stix.modified = new Date();
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
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: 'malformed request'
            }]
        });
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
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }
            const resultObj = result.toObject();
            if (resultObj.metaProperties === undefined) {
                resultObj.metaProperties = {};
            }

            if (resultObj.metaProperties.interactions === undefined) {
                resultObj.metaProperties.interactions = [];
            } else {
                const interactedByUser = resultObj.metaProperties.interactions
                    .find(interaction => interaction.user.id.toString() === user._id.toString());

                if (interactedByUser) {
                    return res.status(500).json({
                        errors: [{
                            status: 500, source: '', title: 'Error', code: '', detail: 'User has already interacted with this'
                        }]
                    });
                }
            }

            resultObj.metaProperties.interactions.push({
                user: {
                    id: user._id,
                    userName: user.userName
                },
                submitted: new Date()
            });

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
                    const obj = newDocument.toObject();
                    return res.status(200).json({
                        links: { self: requestedUrl, },
                        data: {
                            attributes: {
                                ...obj.stix, ...obj.metaProperties, ...obj.extendedProperties, metaProperties: obj.metaProperties
                            }
                        }
                    });
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
};

const relationshipMapper = (req, res) => {
    res.header('Content-Type', 'application/vnd.api+json');
    try {
        const $match = {
            'stix.type': 'relationship'
        };

        const $addToSet = {
            id: '$relatedObjects._id'
        };

        const sourcetype = req.swagger.params.sourcetype.value;
        $match['stix.source_ref'] = new RegExp(`^${sourcetype}--`);

        const targettype = req.swagger.params.targettype.value;
        $match['stix.target_ref'] = new RegExp(`^${targettype}--`);

        const fields = req.swagger.params.fields && req.swagger.params.fields.value ? JSON.parse(req.swagger.params.fields.value) : null;

        if (fields && fields.length) {
            for (const field of fields) {
                const splitFields = field.split('.');
                if (!splitFields || !splitFields.length || !(splitFields[0] === 'stix' || splitFields[0] === 'metaProperties')) {
                    return res.status(403).json({
                        errors: [{
                            status: 403,
                            source: '',
                            title: 'Error',
                            code: '',
                            detail: 'You may only access fields in stix or metaProperties.'
                        }]
                    });
                }

                if (splitFields[0] === 'stix' && splitFields.length > 1) {
                    $addToSet[splitFields.slice(1).join('_')] = `$relatedObjects.${field}`;
                } else {
                    $addToSet[splitFields.join('_')] = `$relatedObjects.${field}`;
                }
            }
        } else {
            $addToSet.name = '$relatedObjects.stix.name';
        }

        const aggregationQuery = [
            { $match },
            {
                $lookup: {
                    from: 'stix',
                    localField: 'stix.target_ref',
                    foreignField: 'stix.id',
                    as: 'relatedObjects'
                }
            },
            {
                $unwind: '$relatedObjects'
            },
            {
                $group: {
                    _id: '$stix.source_ref',
                    relatedObjects: { $addToSet }
                }
            }
        ];

        aggregationModel.aggregate(aggregationQuery, (err, results) => {
            if (err) {
                return res.status(500).json({
                    errors: [{
                        status: 500,
                        source: '',
                        title: 'Error',
                        code: '',
                        detail: 'An unknown error has occurred.'
                    }]
                });
            }
            return res.json({ data: results });
        });
    } catch (error) {
        return res.status(400).json({
            errors: [{
                status: 400,
                source: '',
                title: 'Error',
                code: '',
                detail: 'Malformed request'
            }]
        });
    }
};

module.exports = {
    get,
    count,
    addComment,
    addReply,
    addLike,
    removeLike,
    publish,
    addLabel,
    addInteraction,
    relationshipMapper
};
