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
        convertedResult.data = convertedResult.map(res => {
            const temp = res;
            if (!temp.attributes.metaProperties) {
                temp.attributes.metaProperties = {};
            }
            if (res.attributes !== undefined && res.attributes.kill_chain_phases !== undefined) {
                temp.attributes.metaProperties.groupings = res.attributes.kill_chain_phases.map(kill_chain_phase => {
                    const grouping = {};
                    grouping.groupingValue = kill_chain_phase.phase_name;
                    grouping.groupingName = kill_chain_phase.kill_chain_name;
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
    const aggregationQuery = [
        {
            $match: {
                'stix.type': 'indicator'
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
        },
        {
            $match: {
                relationships: { $not: { $size: 0 } },
                'relationships.stix.target_ref': { $regex: /^attack-pattern--/ }
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
    }
    ];

    aggregationModel.aggregate(query, (err, results) => {
        if (err) {
            return res.status(500).json({
                errors: [{
                    status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                }]
            });
        }
        return res.json({ data: { attributes: results } });
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
                            '$size': '$metaProperties.interactions'
                        },
                        0
                    ]
                },
                likes: {
                    $cond: [{
                            $gt: ['$metaProperties.likes', null]
                        },
                        {
                            '$size': '$metaProperties.likes'
                        },
                        0
                    ]
                },
                comments: {
                    $cond: [{
                            $gt: ['$metaProperties.comments', null]
                        },
                        {
                            '$size': '$metaProperties.comments'
                        },
                        0
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

module.exports = {
    get,
    getById: controller.getById(),
    add: controller.add(),
    update: controller.update(),
    deleteById: controller.deleteById(),
    attackPatternsByIndicator,
    summaryStatistics
};
