const BaseController = require('./shared/basecontroller');
const modelFactory = require('./shared/modelFactory');

const aggregationModel = modelFactory.getAggregationModel('stix');
const controller = new BaseController('indicator');

const get = controller.getCb((err, convertedResult, requestedUrl, req, res) => {
    if (req.swagger.params.metaproperties !== undefined && req.swagger.params.metaproperties.value !== undefined && req.swagger.params.metaproperties.value === true) {
        convertedResult.data = convertedResult.map(res => {
            let temp = res;
            if (res.attributes !== undefined && res.attributes.kill_chain_phases !== undefined) {
                temp.attributes.groupings = res.attributes.kill_chain_phases.map((kill_chain_phase) => {
                    let grouping = {};
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
        data: convertedResult
    });
});

const attackPatternsByIndicator = (req, res) => {

    let aggregationQuery = [
        {
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
                'relationships': { $not: { $size: 0 } },
                'relationships.stix.target_ref': { $regex: /^attack-pattern--/ }
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
                'attackPatterns': {
                    $addToSet: {
                        'id': '$attackPatterns._id',
                        'name': '$attackPatterns.stix.name',
                        'kill_chain_phases': '$attackPatterns.stix.kill_chain_phases',
                        'x_unfetter_sophistication_level': '$attackPatterns.extendedProperties.x_unfetter_sophistication_level',
                        'x_mitre_platforms': '$attackPatterns.extendedProperties.x_mitre_platforms'
                    }
                }
            }
        }
    ];

    aggregationModel.aggregate(aggregationQuery, (err, results) => {
        if (err) {
            return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
        } else {
            return res.json({"data":{"attributes": results }});
        }
    });
};

module.exports = {
    get,
    getById: controller.getById(),
    add: controller.add(),
    update: controller.update(),
    deleteById: controller.deleteById(),
    attackPatternsByIndicator
};