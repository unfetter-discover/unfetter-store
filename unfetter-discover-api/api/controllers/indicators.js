const BaseController = require('./shared/basecontroller');
const modelFactory = require('./shared/modelFactory');
const stixModel = require('../models/schemaless');
const dataHelper = require('../helpers/extended_data_helper');
const sortArrayLength = require('../helpers/sort_by_array_length');
const jsonApiConverter = require('../helpers/json_api_converter');
const SecurityHelper = require('../helpers/security_helper');

const apiRoot = process.env.API_ROOT || 'https://localhost/api';
const aggregationModel = modelFactory.getAggregationModel('stix');
const controller = new BaseController('indicator');

const get = controller.getCb((err, convertedResult, requestedUrl, req, res) => {
    const result = convertedResult;
    if (req.swagger.params.metaproperties !== undefined && req.swagger.params.metaproperties.value !== undefined && req.swagger.params.metaproperties.value === true) {
        result.data = convertedResult.map(response => {
            const temp = response;
            if (!temp.attributes.metaProperties) {
                temp.attributes.metaProperties = {};
            }
            if (response.attributes !== undefined && response.attributes.kill_chain_phases !== undefined) {
                temp.attributes.metaProperties.groupings = response.attributes.kill_chain_phases.map(killChainPhase => {
                    const grouping = {};
                    grouping.groupingValue = killChainPhase.phase_name;
                    grouping.groupingName = killChainPhase.kill_chain_name;
                    return grouping;
                });
            }
            return temp;
        });
    }
    return res.status(200).json({
        links: {
            self: requestedUrl,
        },
        data: result
    });
});

const attackPatternsByIndicator = (req, res) => {
    const aggregationQuery = [{
        $match: {
            'stix.type': 'indicator'
        }
    },
    {
        $lookup: {
            from: 'stix',
            localField: 'stix.id',
            foreignField: 'stix.source_ref',
            as: 'relationships'
        }
    },
    {
        $match: {
            relationships: {
                $not: {
                    $size: 0
                }
            },
            'relationships.stix.target_ref': {
                $regex: /^attack-pattern--/
            }
        }
    },
    {
        $unwind: '$relationships'
    },
    {
        $lookup: {
            from: 'stix',
            localField: 'relationships.stix.target_ref',
            foreignField: 'stix.id',
            as: 'attackPatterns'
        }
    },
    {
        $unwind: '$attackPatterns'
    },
    {
        $group: {
            _id: '$_id',
            attackPatterns: {
                $addToSet: {
                    id: '$attackPatterns._id',
                    name: '$attackPatterns.stix.name',
                    kill_chain_phases: '$attackPatterns.stix.kill_chain_phases',
                    x_unfetter_sophistication_level: '$attackPatterns.extendedProperties.x_unfetter_sophistication_level',
                    x_mitre_platforms: '$attackPatterns.extendedProperties.x_mitre_platforms'
                }
            }
        }
    }
    ];

    aggregationModel.aggregate(query, (err, results) => {
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
        return res.json({
            data: {
                attributes: results
            }
        });
    });
};

const summaryStatistics = (req, res) => {
    const query = [{
        $match: {
            'stix.type': 'indicator'
        }
    },
    {
        $project: {
            created_by_ref: '$stix.created_by_ref',
            views: {
                $cond: [{
                    $gt: ['$metaProperties.interactions', null]
                },
                {
                    $size: '$metaProperties.interactions'
                },
                0 // eslint-disable-line indent
                ]
            },
            likes: {
                $cond: [{
                    $gt: ['$metaProperties.likes', null]
                },
                {
                    $size: '$metaProperties.likes'
                },
                0 // eslint-disable-line indent
                ]
            },
            comments: {
                $cond: [{
                    $gt: ['$metaProperties.comments', null]
                },
                {
                    $size: '$metaProperties.comments'
                },
                0 // eslint-disable-line indent
                ]
            }
        }
    },
    {
        $group: {
            _id: '$created_by_ref',
            count: {
                $sum: 1
            },
            views: {
                $sum: '$views'
            },
            likes: {
                $sum: '$likes'
            },
            comments: {
                $sum: '$comments'
            }
        }
    }
    ];

    aggregationModel.aggregate(query, (err, results) => {
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
        return res.json({
            data: {
                attributes: results
            }
        });
    });
};

const search = (req, res) => {
    const searchParameters = req.swagger.params.searchparameters && req.swagger.params.searchparameters.value ? JSON.parse(req.swagger.params.searchparameters.value) : null;
    const sorttype = req.swagger.params.sorttype && req.swagger.params.sorttype.value ? req.swagger.params.sorttype.value : 'NEWEST';
    const sortObj = {};

    // Database sorts
    switch (sorttype) {
    case 'NEWEST':
        sortObj['stix.created'] = -1;
        break;
    case 'OLDEST':
        sortObj['stix.created'] = 1;
        break;
    default:
        break;
    }
    if (searchParameters) {
        const promises = [];

        // Get filtered indicators
        const filterObj = { 'stix.type': 'indicator' };
        if (searchParameters.indicatorName && searchParameters.indicatorName !== '') {
            filterObj['stix.name'] = { $regex: `.*${searchParameters.indicatorName.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')}.*`, $options: 'i' };
        }
        if (searchParameters.labels && searchParameters.labels.length) {
            filterObj['stix.labels'] = { $in: searchParameters.labels };
        }
        if (searchParameters.organizations && searchParameters.organizations.length) {
            filterObj['stix.created_by_ref'] = { $in: searchParameters.organizations };
        }
        if (searchParameters.killChainPhases && searchParameters.killChainPhases.length) {
            filterObj['stix.kill_chain_phases.phase_name'] = { $in: searchParameters.killChainPhases };
        }
        if (searchParameters.published && searchParameters.published.length) {
            // Mapping is there because mat-option insists on giving a string
            filterObj['metaProperties.published'] = { $in: searchParameters.published.map(p => p === 'true') };
        }

        if (searchParameters.validStixPattern) {
            filterObj['metaProperties.validStixPattern'] = true;
        }

        promises.push(stixModel.find(SecurityHelper.applySecurityFilter(filterObj, req.user)).sort(sortObj).exec());

        // Get relationships of attack patterns if in params, or resolve []
        if (searchParameters.attackPatterns && searchParameters.attackPatterns.length) {
            const apFilter = {
                'stix.type': 'relationship',
                'stix.relationship_type': 'indicates',
                'stix.target_ref': {
                    $in: searchParameters.attackPatterns
                }
            };
            promises.push(stixModel.find(apFilter).select({ 'stix.source_ref': 1 }).exec());
        } else {
            promises.push(Promise.resolve([]));
        }

        // Get sensors if in params, or resovle []
        if (searchParameters.sensors && searchParameters.sensors.length) {
            const sensorFilter = {
                'stix.type': 'x-unfetter-sensor',
                'metaProperties.observedData': { $exists: 1 },
                _id: { $in: searchParameters.sensors }
            };
            promises.push(stixModel.find(SecurityHelper.applySecurityFilter(sensorFilter, req.user)).select({ 'metaProperties.observedData': 1 }).exec());
        } else {
            promises.push(Promise.resolve([]));
        }

        // TODO get sensors, or determine if it should be done client side

        Promise.all(promises)
            .then(([indicatorsRes, apRelationshipsRes, sensorsRes]) => {
                let indicators = dataHelper.getEnhancedData(indicatorsRes, req.swagger.params);

                // Server side filter of attack patterns
                if (searchParameters.attackPatterns && searchParameters.attackPatterns.length) {
                    if (apRelationshipsRes.length) {
                        const indicatorsRelatedToAps = apRelationshipsRes
                            .map(apRel => apRel.toObject())
                            .map(apRel => apRel.stix.source_ref);

                        indicators = indicators.filter(indicator => indicatorsRelatedToAps.includes(indicator.id));
                    } else {
                        // No relationships found, assign empty array
                        indicators = [];
                    }
                }

                // Server side filter of sensors
                if (searchParameters.sensors && searchParameters.sensors.length && sensorsRes.length) {
                    const sensors = sensorsRes.map(sensor => sensor.toObject());
                    indicators = indicators
                        .filter(indicator => indicator.metaProperties && indicator.metaProperties.observedData)
                        .filter(indicator =>
                            sensors.filter(sensor => {
                                let retVal = true;
                                indicator.metaProperties.observedData.forEach(obsData => {
                                    let sensorMatch = false;
                                    sensor.metaProperties.observedData.forEach(sensorObsData => {
                                        if (sensorObsData.name === obsData.name && sensorObsData.action === obsData.action && sensorObsData.property === obsData.property) {
                                            sensorMatch = true;
                                        }
                                    });
                                    if (!sensorMatch) {
                                        retVal = false;
                                    }
                                });
                                return retVal;
                            }).length > 0
                        );
                }

                // Server side sorts (can't be done easily in mongo)
                switch (sorttype) {
                case 'LIKES':
                    indicators = indicators.sort((a, b) => sortArrayLength(a, b, 'likes'));
                    break;
                case 'COMMENTS':
                    indicators = indicators.sort((a, b) => sortArrayLength(a, b, 'comments'));
                    break;
                default:
                    break;
                }
                const requestedUrl = apiRoot + req.originalUrl;
                const convertedResult = jsonApiConverter.convertJsonToJsonApi(indicators, 'indicator', requestedUrl);
                return res.json({ data: convertedResult, links: { self: requestedUrl } });
            })
            .catch(err => {
                res.status(500).json({
                    errors: [{
                        status: 500,
                        source: '',
                        title: 'Error',
                        code: '',
                        detail: `An error has occured: ${err}`
                    }]
                });
            });
    } else {
        return res.status(400).json({
            errors: [{
                status: 500, source: '', title: 'Error', code: '', detail: 'Search parameters are required.'
            }]
        });
    }
};

module.exports = {
    get,
    getById: controller.getById(),
    add: controller.add(),
    update: controller.update(),
    deleteById: controller.deleteById(),
    attackPatternsByIndicator,
    summaryStatistics,
    search
};
