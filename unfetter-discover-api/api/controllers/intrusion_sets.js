const BaseController = require('./shared/basecontroller');
const modelFactory = require('./shared/modelFactory');

const controller = new BaseController('intrusion-set');
const aggregationModel = modelFactory.getAggregationModel('stix');

const attackPatternsByIntrusionSet = (req, res) => {
    const aggregationQuery = [
        {
            $match: {
                'stix.type': 'relationship',
                'stix.source_ref': /^intrusion-set--/,
                'stix.target_ref': /^attack-pattern--/
            }
        },
        {
            $lookup: {
                from: 'stix',
                localField: 'stix.target_ref',
                foreignField: 'stix.id',
                as: 'attackPatterns'
            }
        },
        {
            $unwind: '$attackPatterns'
        },
        {
            $group: {
                _id: '$stix.source_ref',
                attackPatterns: {
                    $addToSet: {
                        id: '$attackPatterns._id'
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
            data: results.map(result => ({ id: result._id, attributes: result }))
        });
    });
};

module.exports = {
    get: controller.get(),
    getById: controller.getById(),
    add: controller.add(),
    update: controller.update(),
    deleteById: controller.deleteById(),
    attackPatternsByIntrusionSet
};
