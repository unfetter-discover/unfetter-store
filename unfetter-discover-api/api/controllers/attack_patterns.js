const BaseController = require('./shared/basecontroller');
const modelFactory = require('./shared/modelFactory');

const controller = new BaseController('attack-pattern');
const aggregationModel = modelFactory.getAggregationModel('stix');

const intrusionSetsByAttackPattern = (req, res) => {
    const aggregationQuery = [{
        $match: {
            'stix.type': 'attack-pattern'
        }
    },
    {
        $lookup: {
            from: 'stix',
            localField: 'stix.id',
            foreignField: 'stix.target_ref',
            as: 'relationships'
        }
    },
    {
        $unwind: '$relationships'
    },
    {
        $match: {
            relationships: {
                $not: {
                    $size: 0
                }
            },
            'relationships.stix.source_ref': {
                $regex: /^intrusion-set--/
            }
        }
    },
    {
        $lookup: {
            from: 'stix',
            localField: 'relationships.stix.source_ref',
            foreignField: 'stix.id',
            as: 'intrusionSets'
        }
    },
    {
        $unwind: '$intrusionSets'
    },
    {
        $group: {
            _id: '$_id',
            intrusionSets: {
                $addToSet: {
                    id: '$intrusionSets._id',
                    name: '$intrusionSets.stix.name'
                }
            }
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
        return res.json({
            data: {
                attributes: results
            }
        });
    });
};

module.exports = {
    get: controller.get(),
    getById: controller.getById(),
    add: controller.add(),
    update: controller.update(),
    deleteById: controller.deleteById()
};
