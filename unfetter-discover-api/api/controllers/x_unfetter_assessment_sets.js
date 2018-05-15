const modelFactory = require('./shared/modelFactory');
const BaseController = require('./shared/basecontroller');
const SecurityHelper = require('../helpers/security_helper');
const parser = require('../helpers/url_parser');

const controller = new BaseController('x-unfetter-assessment-set');
const aggregationModel = modelFactory.getAggregationModel('stix');

/**
 * @description execute the given query as a mongo aggregate pipeline, write to the given response object
 * @param {object} query - mongo aggregate object pipeline object
 * @param {Request} req
 * @param {Response} res
 */
const latestAssessmentSetPromise = (query, req, res) => {
    Promise.resolve(aggregationModel.aggregate(query))
        .then(results => {
            const requestedUrl = req.originalUrl;

            const mappedResults = results
                .map(r => {
                    const retVal = { ...r };
                    retVal.id = r.stix.id;
                    return retVal;
                });

            return res.status(200).json({
                links: {
                    self: requestedUrl,
                },
                data: mappedResults
            });
        })
        .catch(err => // eslint-disable-line no-unused-vars
            res.status(500).json({
                errors: [{
                    status: 500,
                    source: '',
                    title: 'Error',
                    code: '',
                    detail: `Error getting latest assessment sets:\n${err}`
                }]
            }));
};

/**
 * @description fetch assessment sets for given creator id, sort based on last modified
 */
const latestAssessmentSetsByCreatorId = (req, res) => {
    const id = req.swagger.params.creatorId ? req.swagger.params.creatorId.value : '';

    // aggregate pipeline
    //  sort on last modified
    const latestAssessmentSetsByCreatorIdChild = [
        {
            $match: {
                creator: id,
                'stix.type': 'x-unfetter-assessment-set'
            }
        },
        {
            $project: {
                'stix.assessment_sets': {
                    $arrayElemAt: ['$stix.assessment_sets', 0]
                },
                'stix.id': 1,
                'stix.name': 1,
                'stix.modified': 1,
                'stix.created_by_ref': 1,
                creator: 1
            }
        },
        {
            $group: {
                _id: '$stix.id',
                id: {
                    $push: '$stix.id'
                },
                name: {
                    $first: '$stix.name'
                },
                modified: {
                    $max: '$stix.modified'
                },
                creator: {
                    $first: '$creator'
                },
                created_by_ref: {
                    $first: '$stix.created_by_ref'
                },
                stix: {
                    $addToSet: {
                        type: '$stix.assessment_sets.stix.type',
                        id: '$stix.id'
                    }
                }
            }
        },
        {
            $unwind: '$stix'
        },
        {
            $sort: {
                modified: -1
            }
        }
    ];

    latestAssessmentSetPromise(latestAssessmentSetsByCreatorIdChild, req, res);
};

/**
 * @description fetch baselines (assessment sets) whereby the created_by_ref is in the current user's organizations
 *  , sort based on last modified
 */
const latestAssessmentSets = (req, res) => {
    const query = parser.dbQueryParams(req);
    if (query.error) {
        return res.status(400).json({
            errors: [{
                status: 400, source: '', title: 'Error', code: '', detail: query.error
            }]
        });
    }

    const matcherQuery = SecurityHelper.applySecurityFilter(Object.assign({ 'stix.type': 'x-unfetter-assessment-set' }, query.filter), req.user);
    const matchStage = {
        $match: matcherQuery
    };

    // aggregate pipeline
    //  sort on last modified
    const latestAssessmentSetsByCreatedByRefs = [
        matchStage,
        {
            $project: {
                'stix.assessment_sets': {
                    $arrayElemAt: ['$stix.assessment_sets', 0]
                },
                'stix.id': 1,
                'stix.name': 1,
                'stix.modified': 1,
                'stix.created_by_ref': 1,
                creator: 1
            }
        },
        {
            $group: {
                _id: '$stix.id',
                id: {
                    $push: '$stix.id'
                },
                name: {
                    $first: '$stix.name'
                },
                modified: {
                    $max: '$stix.modified'
                },
                creator: {
                    $first: '$creator'
                },
                created_by_ref: {
                    $first: '$stix.created_by_ref'
                },
                stix: {
                    $addToSet: {
                        type: '$stix.assessment_sets.stix.type',
                        id: '$stix.id'
                    }
                }
            }
        },
        {
            $unwind: '$stix'
        },
        {
            $sort: {
                modified: -1
            }
        }
    ];

    latestAssessmentSetPromise(latestAssessmentSetsByCreatedByRefs, req, res);
};

module.exports = {
    get: controller.get(),
    getById: controller.getById(),
    add: controller.add(),
    update: controller.update(),
    deleteById: controller.deleteById(),
    latestAssessmentSetsByCreatorId,
    latestAssessmentSets,
};
