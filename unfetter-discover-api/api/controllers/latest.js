const mongoose = require('mongoose');
const SecurityHelper = require('../helpers/security_helper');

const schema = mongoose.Schema({}, {
    strict: false
});

const writeErrorResp = (res, msg) => {
    const detail = msg || 'An unknown error has occurred.';
    return res.status(500).json({
        error: {
            status: 500,
            source: '',
            title: 'Error',
            code: '',
            detail: detail,
        },
    });
};

const callPromise = (query, req, res) => {
    const aggregationModel = modelFactory();
    Promise.resolve(aggregationModel.aggregate(query))
        .then(results => {
            const requestedUrl = req.originalUrl;
            return res.status(200).json({
                links: {
                    self: requestedUrl,
                },
                data: results
            });
        })
        .catch((err) => {
            writeErrorResp(res, err);
        });
};

/**
 * @description fetch stix of given type for given creator id, sort base on last modified
*/
const getLatestByTypeAndCreatorId = (req, res) => {
    res.header('Content-Type', 'application/vnd.api+json');
    const id = req.swagger.params.id ? req.swagger.params.id.value : '';
    const type = req.swagger.params.type ? req.swagger.params.type.value : '';

    // const user = req.user;
    // const requestorId = user && user._id.toString() ? user._id.toString() : '';
    // const isAdmin = SecurityHelper.isAdmin(req.user);
    // console.log(requestorId + ' ' + id + ' ' + isAdmin);
    // if (isAdmin === false && requestorId.trim() !== id.trim()) {
    //     console.log('cannot query');
    //     return writeErrorResp(res, 'non admin requestor must query for their own creatorId');
    // }
    let query = {
        creator: id,
        'stix.type': type
    };
    query = SecurityHelper.applySecurityFilter(query, req.user);
    // aggregate pipeline
    //  match on given user and given type
    //  sort on last modified
    const latestByTypeAndCreator = [
        {
            $match: query,
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
                type: {
                    $first: '$stix.type'
                },
                modified: {
                    $max: '$stix.modified'
                },
                creator: {
                    $first: '$creator'
                }
            }
        },
        {
            $unwind: '$id'
        },
        {
            $sort: {
                modified: -1
            }
        }
    ];

    callPromise(latestByTypeAndCreator, req, res);
};

/**
 * @description fetch ids for given stix type, sort base on last modified
 */
const getLatestByType = (req, res) => {
    res.header('Content-Type', 'application/vnd.api+json');
    const type = req.swagger.params.type ? req.swagger.params.type.value : '';

    let query = {
        'stix.type': type
    };
    query = SecurityHelper.applySecurityFilter(query, req.user);
    // aggregate pipeline
    //  match on type
    //  sort on last modified
    const latestByType = [
        {
            $match: query,
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
                type: {
                    $first: '$stix.type'
                },
                modified: {
                    $max: '$stix.modified'
                },
                created_by_ref: {
                    $first: '$stix.created_by_ref'
                }
            }
        },
        {
            $unwind: '$id'
        },
        {
            $sort: {
                modified: -1
            }
        }
    ];
    callPromise(latestByType, req, res);
};


/**
 * @description fetch stix of given type for given creator id, sort base on last modified
 */
const getLatestThreatReportsByCreatorId = (req, res) => {
    const id = req.swagger.params.id ? req.swagger.params.id.value : '';
    res.header('Content-Type', 'application/vnd.api+json');

    // const user = req.user;
    // const requestorId = user && user._id.toString() ? user._id.toString() : '';
    // const isAdmin = SecurityHelper.isAdmin(req.user);
    // console.log(requestorId + ' ' + id + ' ' + isAdmin);
    // if (isAdmin === false && requestorId.trim() !== id.trim()) {
    //     return writeErrorResp(res, 'non admin requestor must query for their own creatorId');
    // }
    let query = {
        creator: id,
        'stix.type': 'report'
    };
    query = SecurityHelper.applySecurityFilter(query, req.user);
    // aggregate pipeline
    const latestByCreatorWithRollup = [
        {
            $match: query,
        },
        ...threatReportGroupAndUnwind()
    ];
    // console.log(JSON.stringify(latestByCreatorWithRollup));
    callPromise(latestByCreatorWithRollup, req, res);
};

/**
 * @description fetch ids for given stix type, sort base on last modified
 */
const getLatestThreatReports = (req, res) => {
    res.header('Content-Type', 'application/vnd.api+json');

    let query = {
        'stix.type': 'report'
    };
    query = SecurityHelper.applySecurityFilter(query, req.user);
    // aggregate pipeline
    const latest = [
        {
            $match: query,
        },
        ...threatReportGroupAndUnwind()
    ];
    // console.log(JSON.stringify(latest));
    callPromise(latest, req, res);
};

const threatReportGroupAndUnwind = () => {
    // aggregate pipeline
    // no match
    // group on workproduct ids
    // unwind the arrays
    // sort on last modified
    return [{
        $group: {
            _id: '$metaProperties.work_products.id',
            workproductId: {
                $first: '$metaProperties.work_products.id'
            },
            reportIds: {
                $push: '$stix.id'
            },
            name: {
                $first: '$stix.name'
            },
            type: {
                $first: '$stix.type'
            },
            modified: {
                $max: '$stix.modified'
            },
            created_by_ref: {
                $first: '$stix.created_by_ref'
            }
        }
    },
    {
        $unwind: '$_id'
    },
    {
        $unwind: '$workproductId'
    },
    {
        $sort: {
            modified: -1
        }
    }];
};

const modelFactory = () => mongoose.model('aggregations', schema, 'stix');

module.exports = {
    getLatestByTypeAndCreatorId,
    getLatestByType,
    getLatestThreatReports,
    getLatestThreatReportsByCreatorId,
};
