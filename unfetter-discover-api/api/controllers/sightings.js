const BaseController = require('./shared/basecontroller');
const stixModel = require('../models/schemaless');
const SecurityHelper = require('../helpers/security_helper');
const parser = require('../helpers/url_parser');

const apiRoot = process.env.API_ROOT || 'https://localhost/api';

const controller = new BaseController('sighting');

/**
 * @param  {*} mongoDoc
 * @returns {*} object
 * @description Turns a mongo obj to a property, unwraps extended and meta properties from a mongo doc
 */
function transformMongoDoc(mongoDoc) {
    const mongoObj = { ...mongoDoc.toObject() };
    return { ...mongoObj.stix, ...mongoObj.extendedProperties, ...mongoObj.metaProperties };
}

const jsonApiTransform = (obj, urlRoot) => {
    const apiObj = {
        type: obj.type,
        id: obj.id,
        attributes: obj,
        links: {
            self: `${urlRoot}/${obj.id}`
        }
    };
    return apiObj;
};

/**
 * @param  {*} req
 * @param  {*} res
 * @description Returns multiples sightings and their related objects
 */
const sightingGroup = (req, res) => {
    const query = parser.dbQueryParams(req);
    let data = [];
    if (query.error) {
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: query.error
            }]
        });
    }
    // Get sighting
    stixModel.find(SecurityHelper.applySecurityFilter({ 'stix.type': 'sighting', ...query.filter }, req.user), (sightingErr, sightingResults) => {
        if (sightingErr || !sightingResults.length) {
            return res.status(500).json({
                errors: [{
                    status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                }]
            });
        }
        const sightings = sightingResults.map(sighting => transformMongoDoc(sighting));
        data = data.concat(sightings);
        const refIds = new Set();
        for (const sighting of sightings) {
            if (sighting.created_by_ref) {
                refIds.add(sighting.created_by_ref);
            }
            if (sighting.sighting_of_ref) {
                refIds.add(sighting.sighting_of_ref);
            }
            if (sighting.where_sighted_refs && sighting.where_sighted_refs.length) {
                sighting.where_sighted_refs.forEach(refId => refIds.add(refId));
            }
            if (sighting.observed_data_refs && sighting.observed_data_refs.length) {
                sighting.observed_data_refs.forEach(refId => refIds.add(refId));
            }
        }
        // Get objects referenced by sighting
        stixModel.find(SecurityHelper.applySecurityFilter({ _id: { $in: Array.from(refIds) } }), (refErr, refResults) => {
            if (refErr) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }
            const refObjs = refResults.map(ref => transformMongoDoc(ref));
            data = data.concat(refObjs);

            // Get identities from ref objs
            const unincludedIdentities = new Set();
            refObjs
                .map(refObj => refObj.created_by_ref)
                .filter(createdByRef => !refIds.has(createdByRef))
                .forEach(createdByRef => unincludedIdentities.add(createdByRef));

            stixModel.find(SecurityHelper.applySecurityFilter({ _id: { $in: Array.from(unincludedIdentities) } }), (identitiesErr, identitiesResults) => {
                if (identitiesErr) {
                    return res.status(500).json({
                        errors: [{
                            status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                        }]
                    });
                }
                data = data.concat(identitiesResults.map(ir => transformMongoDoc(ir)));
                const requestedUrl = apiRoot + req.originalUrl;
                const convertedResult = data.map(dat => jsonApiTransform(dat, requestedUrl));
                return res.status(200).json({ links: { self: requestedUrl, }, data: convertedResult });
            });
        });
    })
    .limit(query.limit)
    .sort(query.sort)
    .limit(query.limit)
    .skip(query.skip);
};

/**
 * @param  {*} req
 * @param  {*} res
 * @description Returns all objects related a sighting
 */
const sightingGroupById = (req, res) => {
    const id = req.swagger.params.id ? req.swagger.params.id.value : null;
    let data = [];
    if (id) {
        // Get sighting
        stixModel.find(SecurityHelper.applySecurityFilter({ _id: id }, req.user), (sightingErr, sightingResults) => {
            if (sightingErr || !sightingResults.length) {
                return res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            }
            const sighting = transformMongoDoc(sightingResults[0]);
            data.push(sighting);
            const refIds = new Set();
            if (sighting.created_by_ref) {
                refIds.add(sighting.created_by_ref);
            }
            if (sighting.sighting_of_ref) {
                refIds.add(sighting.sighting_of_ref);
            }
            if (sighting.where_sighted_refs && sighting.where_sighted_refs.length) {
                sighting.where_sighted_refs.forEach(refId => refIds.add(refId));
            }
            if (sighting.observed_data_refs && sighting.observed_data_refs.length) {
                sighting.observed_data_refs.forEach(refId => refIds.add(refId));
            }
            // Get objects referenced by sighting
            stixModel.find(SecurityHelper.applySecurityFilter({ _id: { $in: Array.from(refIds) } }), (refErr, refResults) => {
                if (refErr) {
                    return res.status(500).json({
                        errors: [{
                            status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                        }]
                    });
                }
                const refObjs = refResults.map(ref => transformMongoDoc(ref));
                data = data.concat(refObjs);

                // Get identities from ref objs
                const unincludedIdentities = new Set();
                refObjs
                    .map(refObj => refObj.created_by_ref)
                    .filter(createdByRef => !refIds.has(createdByRef))
                    .forEach(createdByRef => unincludedIdentities.add(createdByRef));

                stixModel.find(SecurityHelper.applySecurityFilter({ _id: { $in: Array.from(unincludedIdentities) } }), (identitiesErr, identitiesResults) => {
                    if (identitiesErr) {
                        return res.status(500).json({
                            errors: [{
                                status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                            }]
                        });
                    }
                    data = data.concat(identitiesResults.map(ir => transformMongoDoc(ir)));
                    // TODO jsonapi
                    const requestedUrl = apiRoot + req.originalUrl;
                    const convertedResult = data.map(dat => jsonApiTransform(dat, requestedUrl));
                    return res.status(200).json({ links: { self: requestedUrl, }, data: convertedResult });
                });
            });
        })
        .limit(1);
    } else {
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: 'no id'
            }]
        });
    }
};

module.exports = {
    get: controller.get(),
    getById: controller.getById(),
    add: controller.add(),
    update: controller.update(),
    deleteById: controller.deleteById(),
    sightingGroup,
    sightingGroupById
};
