const AssessmentPipelineHelper = require('../helpers/assessment_pipeline_helper');
const BaseController = require('./shared/basecontroller');

const controller = new BaseController('x-unfetter-assessment');
const jsonApiConverter = require('../helpers/json_api_converter');
const lodash = require('lodash');
const modelFactory = require('./shared/modelFactory');
// NOTE: object return and query names are order dependent
const ASSESSED_OBJECT_RETURN_TYPES = ['courseOfActions', 'indicators', 'sensors', 'capabilities'];
const ASSESSED_OBJECT_QUERY_TYPES = ['course-of-action', 'indicator', 'x-unfetter-sensor', 'x-unfetter-object-assessment'];
const apiRoot = process.env.API_ROOT || 'https://localhost/api';
const models = {};

ASSESSED_OBJECT_QUERY_TYPES.forEach(assessedObjectType => {
    models[assessedObjectType] = modelFactory.getModel(assessedObjectType);
});
models['attack-pattern'] = modelFactory.getModel('attack-pattern');

const aggregationModel = modelFactory.getAggregationModel('stix');

// REUSAGE FUNCTIONS
// These functions are reused among multiple api calls

// Give a set of assessments, returns the total risk level
function calculateRiskByQuestion(assessments) {
    const questions = [];
    let total = 0;
    let count = 0;
    lodash.forEach(assessments, assessment => {
        lodash.forEach(assessment.questions, currentQuestion => {
            total += currentQuestion.risk;
            count += 1;
            const foundQuestion = questions.find(object => object.name === currentQuestion.name);
            if (foundQuestion) {
                foundQuestion.risk += currentQuestion.risk;
                foundQuestion.total += 1;
            } else {
                const riskObject = {};
                riskObject.name = currentQuestion.name;
                riskObject.risk = currentQuestion.risk;
                riskObject.total = 1;
                questions.push(riskObject);
            }
        });
    });
    const returnObject = {};
    returnObject.risk = total / count;
    lodash.forEach(questions, question => {
        question.risk /= question.total; // eslint-disable-line no-param-reassign
    });
    returnObject.questions = questions;
    return returnObject;
}

function getPromises(assessment) {
    const assessedObjectIDs = {};
    if (assessment && assessment.stix) {
        assessment.stix.assessment_objects
            .map(assessmentObj => assessmentObj.stix)
            .forEach(assessmentObj => {
                if (assessedObjectIDs[assessmentObj.type] === undefined) {
                    assessedObjectIDs[assessmentObj.type] = [];
                }
                assessedObjectIDs[assessmentObj.type].push(assessmentObj.id);
            });
    }

     // Generate promises using the ASSESSED_OBJECT_TYPES enum so Promise.all methods get the return in the order expected
    // Don't bother running a mongo query for empty objects
    const promises = [];

    ASSESSED_OBJECT_QUERY_TYPES.forEach(assessedObjectType => {
        let assessedPromise;
        const initialMatch = {
            $match: {
                _id: {
                    $in: assessedObjectIDs[assessedObjectType]
                }
            }
        };
        if (assessedObjectIDs[assessedObjectType] === undefined || assessedObjectIDs[assessedObjectType].length === 0) {
            assessedPromise = Promise.resolve([]);
        } else if (assessedObjectType !== ASSESSED_OBJECT_QUERY_TYPES[3]) { // capability
            assessedPromise = models[assessedObjectType].aggregate(initialMatch);
        } else {
            assessedPromise = models[assessedObjectType].aggregate([initialMatch,
                {
                    $unwind: '$stix.assessed_objects'
                },
                {
                    $lookup: {
                        from: 'stix',
                        localField: 'stix.assessed_objects.assessed_object_ref',
                        foreignField: 'stix.id',
                        as: 'attack_pattern'
                    }
                },
                {
                    $unwind: '$attack_pattern'
                },
                {
                    $unwind: '$attack_pattern.stix.kill_chain_phases'
                },
                {
                    $project: {
                        _id: 1,
                        metaProperties: 1,
                        stix: 1,
                        assessed_objects: '$stix.assessed_objects',
                        kill_chain_phases: '$attack_pattern.stix.kill_chain_phases'
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        metaProperties: {
                            $first: '$metaProperties'
                        },
                        stix: {
                            $first: '$stix',
                        },
                        kill_chain_phases: {
                            $addToSet: {
                                phase_name: '$kill_chain_phases.phase_name',
                                kill_chain_name: '$kill_chain_phases.kill_chain_name',
                            }
                        },
                        assessed_objects: {
                            $addToSet: {
                                questions: '$assessed_objects.questions',
                                assessed_object_ref: '$assessed_objects.assessed_object_ref',
                            }
                        },
                    },
                },
                {
                    $project: {
                        _id: 1,
                        metaProperties: 1,
                        stix: {
                            type: 1,
                            id: 1,
                            name: 1,
                            description: 1,
                            created_by_ref: 1,
                            created: 1,
                            modified: 1,
                            object_ref: 1,
                            assessed_objects: '$assessed_objects',
                            kill_chain_phases: '$kill_chain_phases',
                        }
                    }
                }
            ]);
        }
        promises.push(assessedPromise);
    });
    return promises;
}

const assessedObjects = controller.getByIdCb((err, result, req, res, id) => { // eslint-disable-line no-unused-vars
    const [assessment] = result;
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

    return Promise.all(getPromises(assessment))
        .then(results => {
            const assessmentObjects = assessment.stix.assessment_objects;
            const returnObject = ASSESSED_OBJECT_RETURN_TYPES
                .map((returnProp, i) => {
                    const assessmentRisks = results[i]
                        .map(stix => {
                            const stixObj = stix;
                            const assessedData = assessmentObjects.find(assessmentObject => assessmentObject.stix.id === stix._id);
                            if (assessedData !== null && assessedData !== undefined && assessedData.risk !== undefined) {
                                stixObj.risk = assessedData.risk;
                            }
                            return stixObj;
                        })
                        .reduce((acc, x) => acc.concat(x), []);
                    return assessmentRisks;
                })
                .reduce((acc, x) => acc.concat(x), []);

            const requestedUrl = apiRoot + req.originalUrl;
            res.header('Content-Type', 'application/json');
            res.json({
                data: returnObject,
                links: {
                    self: requestedUrl,
                },
            });
        })
        .catch(promiseErr => res.status(500).json({ // eslint-disable-line no-unused-vars
            errors: [{
                status: 500,
                source: '',
                title: 'Error',
                code: '',
                detail: 'An unknown error has occurred.'
            }]
        }));
});

// Takes a set of Kill Chain phase names, and groups the STIX objects.
function groupByKillChain(distinctKillChainPhaseNames, objects, isIndicator) {
    const killChainPhases = [];
    lodash.forEach(distinctKillChainPhaseNames, phaseName => {
        const aps = lodash.filter(objects, object => {
            // If "phase" is found in any of object.kill_chain_phases....
            let collection = null;
            if (isIndicator) {
                collection = object.kill_chain_phases;
            } else {
                collection = object.groupings;
            }
            const found = lodash.some(collection, phase => {
                let name = '';
                if (isIndicator) {
                    name = phase.phase_name;
                } else {
                    name = phase.groupingValue;
                }
                const phaseMatch = name === phaseName;
                return phaseMatch;
            });
            return found;
        });
        killChainPhases.push({
            name: phaseName,
            objects: aps,
        });
    });
    return killChainPhases;
}

// Will group the objects by the kill chain phase name, and will group the risk for each group.
function calculateRiskPerKillChain(workingObjects, useKillChainPhaseName) {
    let collectionName = 'groupings';
    let phaseName = 'groupingValue';
    if (useKillChainPhaseName) {
        collectionName = 'kill_chain_phases';
        phaseName = 'phase_name';
    }
    const killChains = lodash.sortBy(lodash.uniqBy(lodash.flatMap(lodash.flatMapDeep(workingObjects, collectionName), phaseName)));
    const groupedObjects = groupByKillChain(killChains, workingObjects, useKillChainPhaseName);
    const returnObjects = [];
    lodash.forEach(groupedObjects, killChainGroup => {
        const returnObject = calculateRiskByQuestion(killChainGroup.objects);
        returnObject.objects = killChainGroup.objects;
        returnObject.phaseName = killChainGroup.name;
        returnObjects.push(returnObject);
    });
    return returnObjects;
}

/**
 * @description Will group assessed objects into Attack Kill Chains, and calculates the risks
 *  The data is not json-api
 */
const riskPerKillChain = controller.getByIdCb((err, result, req, res, id) => { // eslint-disable-line no-unused-vars
    let [assessment] = result;

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

    return Promise.all(getPromises(assessment))
        .then(results => {
            if (!assessment) {
                assessment = {};
            } else {
                assessment = assessment.toObject().stix;
            }

            const courseOfActions = results[0]
                .filter(doc => doc !== undefined)
                .map(doc => ({
                    ...doc.stix,
                    ...doc.metaProperties
                }));
            const coaRisks = [];

            const indicators = results[1]
                .filter(doc => doc !== undefined)
                .map(doc => ({
                    ...doc.stix,
                    ...doc.metaProperties
                }));
            const indicatorRisks = [];

            const sensors = results[2]
                .filter(doc => doc !== undefined)
                .map(doc => ({
                    ...doc.stix,
                    ...doc.metaProperties
                }));
            const sensorRisks = [];

            const capabilities = results[3]
                .filter(doc => doc !== undefined)
                .map(doc => ({
                    ...doc.stix,
                    ...doc.metaProperties
                }));
            const capabilityRisks = [];

            const returnObject = {};
            returnObject.indicators = [];
            returnObject.sensors = [];
            returnObject.courseOfActions = [];
            returnObject.capabilities = [];
            lodash.forEach(indicators, stix => {
                const assessedObject = lodash.find(assessment.assessment_objects, o => o.stix.id === stix.id);
                const stixObject = stix;
                stixObject.risk = assessedObject.risk;
                stixObject.questions = assessedObject.questions;
                indicatorRisks.push(stixObject);
            });
            lodash.forEach(courseOfActions, stix => {
                const assessedObject = lodash.find(assessment.assessment_objects, o => o.stix.id === stix.id);
                const stixObject = stix;
                stixObject.risk = assessedObject.risk;
                stixObject.questions = assessedObject.questions;
                coaRisks.push(stixObject);
            });
            lodash.forEach(sensors, stix => {
                const assessedObject = lodash.find(assessment.assessment_objects, o => o.stix.id === stix.id);
                const stixObject = stix;
                stixObject.risk = assessedObject.risk;
                stixObject.questions = assessedObject.questions;
                sensorRisks.push(stixObject);
            });
            lodash.forEach(capabilities, stix => {
                const assessedObject = lodash.find(assessment.assessment_objects, o => o.stix.id === stix.id);
                const stixObject = stix;
                stixObject.risk = assessedObject.risk;
                stixObject.questions = assessedObject.questions;
                capabilityRisks.push(stixObject);
            });
            if (indicators.length > 0) {
                returnObject.indicators = calculateRiskPerKillChain(indicatorRisks, true);
            }
            if (sensors.length > 0) {
                returnObject.sensors = calculateRiskPerKillChain(sensorRisks, false);
            }

            if (courseOfActions.length > 0) {
                returnObject.courseOfActions = calculateRiskPerKillChain(coaRisks, false);
            }
            if (capabilities.length > 0) {
                returnObject.capabilities = calculateRiskPerKillChain(capabilityRisks, true);
            }
            const requestedUrl = apiRoot + req.originalUrl;
            res.header('Content-Type', 'application/json');
            res.json({
                data: returnObject,
                links: {
                    self: requestedUrl,
                },
            });
        });
});

// Get the Rollup Risk. Will return a totalRisk, then riskByMeasurement.
const risk = controller.getByIdCb((err, result, req, res, id) => { // eslint-disable-line no-unused-vars
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
    const returnObject = calculateRiskByQuestion(result[0].stix.assessment_objects);
    const requestedUrl = apiRoot + req.originalUrl;
    res.header('Content-Type', 'application/json');
    res.json({
        data: returnObject,
        links: {
            self: requestedUrl,
        },
    });
});

/**
 * TODO:
 * Given a phase name of a Kill Chain, return all assessements for that Kill Chain
 * An Attack Pattern has a kill chain.  Indicators, Sensors and COA have also been given
 * kill chains to allow them to be grouped.  This function will return all the assessment
 * for ATTACK Kill Chains
 * @param {*} req
 * @param {*} res
 */
const riskByAttackPatternAndKillChain = (req, res) => {
    const id = req.swagger.params.id ? req.swagger.params.id.value : '';
    const isCapability = req.swagger.params.isCapability.value || false;
    const attackPatternsByPhase = AssessmentPipelineHelper.buildAttackPatternsByPhasePipeline(id, isCapability);
    const assessedByAttackPattern = AssessmentPipelineHelper.buildAttackPatternByKillChainPipeline(id, isCapability);
    const attackPatternsByKillChain = AssessmentPipelineHelper.buildAttackPatternsByKillChainPipeline();

    Promise.all([
        aggregationModel.aggregate(attackPatternsByPhase),
        aggregationModel.aggregate(assessedByAttackPattern),
        aggregationModel.aggregate(attackPatternsByKillChain),
    ])
        .then(results => {
            if (results) {
                const requestedUrl = apiRoot + req.originalUrl;
                const returnObj = {};
                const PHASE_POSITION = 0;
                const ABAP_POSITION = 1;
                const APBKC_POSITION = 2;
                returnObj.phases = results[PHASE_POSITION];
                returnObj.assessedByAttackPattern = results[ABAP_POSITION];
                returnObj.attackPatternsByKillChain = results[APBKC_POSITION];

                return res.status(200).json({
                    links: {
                        self: requestedUrl,
                    },
                    data: returnObj
                });
            }

            return res.status(404).json({
                message: `No item found with id ${id}`
            });
        })
        .catch(err => // eslint-disable-line no-unused-vars
            res.status(500).json({
                errors: [{
                    status: 500,
                    source: '',
                    title: 'Error',
                    code: '',
                    detail: 'An unknown error has occurred.'
                }]
            }));
};

/**
 *
 * @param {*} req
 * @param {*} res
 */
const summaryAggregations = (req, res) => {
    const id = req.swagger.params.id ? req.swagger.params.id.value : '';

    const attackPatternsByAssessedObject = [{
        $match: {
            'stix.id': id
        }
    },
    {
        $unwind: '$stix.assessment_objects'
    },
    {
        $lookup: {
            from: 'stix',
            localField: 'stix.assessment_objects.stix.id',
            foreignField: 'stix.source_ref',
            as: 'relationships'
        }
    },
    {
        $unwind: '$relationships'
    },
    {
        $match: {
            'relationships.stix.target_ref': {
                $regex: /^attack-pattern.*/
            }
        }
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
        $match: {
            'attackPatterns.extendedProperties.x_unfetter_sophistication_level': {
                $ne: null
            }
        }
    },
    {
        $group: {
            _id: '$stix.assessment_objects.stix.id',
            attackPatterns: {
                $addToSet: {
                    attackPatternId: '$attackPatterns.stix.id',
                    x_unfetter_sophistication_level: '$attackPatterns.extendedProperties.x_unfetter_sophistication_level',
                    kill_chain_phases: '$attackPatterns.stix.kill_chain_phases'
                }
            },
        }
    },
    ];

    Promise.all([
        aggregationModel.aggregate(attackPatternsByAssessedObject),
        models['attack-pattern'].find({
            'extendedProperties.x_unfetter_sophistication_level': {
                $ne: null
            }
        }),
    ])
        .then(results => {
            if (results) {
                const requestedUrl = apiRoot + req.originalUrl;
                const returnObj = {};
                const APBAO_POSITION = 0;
                const ALL_ATTACK_PATTERNS_POSITION = 1;
                const tempAttackPatternsByAssessedObject = results[APBAO_POSITION];
                const allAttackPattenrns = results[ALL_ATTACK_PATTERNS_POSITION];
                const sophisticationSetMap = {};

                // Push assessed attack patterns to a set by sophisication level
                tempAttackPatternsByAssessedObject.forEach(tempAttackPatternByAssessedObject => {
                    tempAttackPatternByAssessedObject.attackPatterns.forEach(ap => {
                        if (sophisticationSetMap[ap.x_unfetter_sophistication_level] === undefined) {
                            sophisticationSetMap[ap.x_unfetter_sophistication_level] = new Set();
                        }
                        sophisticationSetMap[ap.x_unfetter_sophistication_level].add(ap.attackPatternId);
                    });
                });

                const sophisticationTallyMap = {};
                // Tally up set sizes to get count by sophisication level
                for (const level in sophisticationSetMap) {
                    if (Object.prototype.hasOwnProperty.call(sophisticationSetMap, level)) {
                        sophisticationTallyMap[level] = sophisticationSetMap[level].size;
                    }
                }

                const allAttackPatternTallyMap = {};
                // Map all attack pattern to a total tally
                allAttackPattenrns.forEach(ap => {
                    if (allAttackPatternTallyMap[ap.extendedProperties.x_unfetter_sophistication_level] === undefined) {
                        allAttackPatternTallyMap[ap.extendedProperties.x_unfetter_sophistication_level] = 0;
                    }
                    allAttackPatternTallyMap[ap.extendedProperties.x_unfetter_sophistication_level] += 1;
                });

                returnObj.attackPatternsByAssessedObject = tempAttackPatternsByAssessedObject;
                returnObj.assessedAttackPatternCountBySophisicationLevel = sophisticationTallyMap;
                returnObj.totalAttackPatternCountBySophisicationLevel = allAttackPatternTallyMap;

                return res.status(200).json({
                    links: {
                        self: requestedUrl,
                    },
                    data: returnObj
                });
            }

            return res.status(404).json({
                message: `No item found with id ${id}`
            });
        })
        .catch(err => // eslint-disable-line no-unused-vars
            res.status(500).json({
                errors: [{
                    status: 500,
                    source: '',
                    title: 'Error',
                    code: '',
                    detail: 'An unknown error has occurred.'
                }]
            }));
};

/**
 * @description Get the total Risk of a single Assessed Object of a certain Assessed Object
 */
const getRiskByAssessedObject = controller.getByIdCb((err, result, req, res, id) => { // eslint-disable-line no-unused-vars
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
    const objectId = req.swagger.params.objectId ? req.swagger.params.objectId.value : '';
    const assessedObject = result[0].stix.assessment_objects.find(o => o.stix.id === objectId);
    const returnObject = assessedObject.risk;
    const requestedUrl = apiRoot + req.originalUrl;
    res.header('Content-Type', 'application/json');
    res.json({
        data: returnObject,
        links: {
            self: requestedUrl,
        },
    });
});

/**
 * @description Get the total Risk of a single Assessed Object of a certain Assessed Object
 */
const getAnswerByAssessedObject = controller.getByIdCb((err, result, req, res, id) => { // eslint-disable-line no-unused-vars
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
    const questionNumber = req.swagger.params.question ? req.swagger.params.question.value : 0;
    const objectId = req.swagger.params.objectId ? req.swagger.params.objectId.value : '';
    const assessedObject = result[0].stix.assessment_objects.find(o => o.stix.id === objectId);
    const returnObject = assessedObject.questions[questionNumber].selected_value;
    const requestedUrl = apiRoot + req.originalUrl;
    res.header('Content-Type', 'application/json');
    res.json({
        data: returnObject,
        links: {
            self: requestedUrl,
        },
    });
});

/**
 * @description With a given assessmentID, and assessedObjectId, and a new answer value, go through the questions
 * of that assessed object and give the new answers.
 * Recalculate the updated risks.
 * Updates mongo with the new values
 */
const updateAnswerByAssessedObject = controller.getByIdCb((err, result, req, res, id) => {
    // If there was an error returning the assessment object, return error.
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
    } else if (!result || !result.length) {
        return res.status(404).json({
            errors: [{
                status: 404,
                source: '',
                title: 'Error',
                code: '',
                detail: 'Assessment not found.'
            }]
        });
    }

    //  The ObjectId is the assessed Object id.  Indicator, sensor or mitigations, more likely
    const objectId = req.swagger.params.objectId ? req.swagger.params.objectId.value : '';
    //  The answer is a value of the index of the answer to select for each question.  We assume
    //  we are changing all the values back to the same answer.

    const answer = req.swagger.params.data.value.data.attributes.answer ? req.swagger.params.data.value.data.attributes.answer : 0;
    const questionId = req.swagger.params.question ? req.swagger.params.question.value : '';

    // answer should be an integer to represent an index value of the array of question options.
    if ((answer >= 0)) {
        const assessment = result[0].toObject();
        // The array of assessed objects
        const assessedObject = assessment.stix.assessment_objects.find(o => o.stix.id === objectId);

        // go through and change the answer to each of these questions.
        let riskValue = 0;

        lodash.forEach(assessedObject.questions, (question, index) => {
            if ((answer <= question.options.length) && ((questionId === '') || (questionId === index.toString()))) {
                question.selected_value = question.options[answer]; // eslint-disable-line no-param-reassign
                riskValue += question.selected_value.risk;
                question.risk = question.selected_value.risk; // eslint-disable-line no-param-reassign
            }
        });
        assessedObject.risk = riskValue / assessedObject.questions.length;


        // Update the Mongoose model
        try {
            const Model = modelFactory.getModel(assessment.stix.type);
            const newDocument = new Model(assessment);
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
            Model.findOneAndUpdate({
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
                    const convertedResult = jsonApiConverter.convertJsonToJsonApi(resultUpdate.stix, assessment.stix.type, requestedUrl);
                    return res.status(200).json({
                        links: {
                            self: requestedUrl,
                        },
                        data: convertedResult
                    });
                }

                return res.status(404).json({
                    message: `Unable to update the item.  No item found with id ${id}`
                });
            });
        } catch (error) {
            console.log(`error ${error}`);
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
    } else {
        return res.status(404).json({
            errors: [{
                status: 404,
                source: '',
                title: 'Error',
                code: '',
                detail: 'Answer was not valid for this system.'
            }]
        });
    }
});

/**
 * @description
 *  if demo mode, the user can query all the open identity data
 *  if uac and the user is not admin, then return the users orgs
 * @param {*} user - optional
 * @param {*} orgs array of ids representing the organizations this user can view, based on user and RUN_MODE
 */
const generateGroupIdsForUser = user => {
    if (process.env.RUN_MODE === 'DEMO') {
        return [global.unfetter.openIdentity._id];
    }
    // If using UAC, confirm user can post to that group
    if (process.env.RUN_MODE === 'UAC' && user && user.role !== 'ADMIN') {
        const userOrgIds = user.organizations
            .filter(org => org.approved)
            .map(org => org.id);
        return userOrgIds;
    }
};

/**
 * @description execute the given query as a mongo aggregate pipeline, write to the given response object
 * @param {object} query - mongo aggregate object pipeline object
 * @param {Request} req
 * @param {Response} res
 */
const latestAssessmentPromise = (query, req, res) => {
    Promise.resolve(aggregationModel.aggregate(query))
        .then(results => {
            const requestedUrl = req.originalUrl;
            const mappedResults = results
                .map(r => {
                    const retVal = { ...r };
                    retVal.id = r.stix.id;
                    // NOTE this is a temporary fix for naming in rollupId
                    // TODO remove this when a better fix is in place
                    if (r.stix.type) {
                        switch (r.stix.type) {
                        case 'course-of-action':
                            retVal.name = `${r.name} - Mitigations`;
                            break;
                        case 'indicator':
                            retVal.name = `${r.name} - Indicators`;
                            break;
                        case 'x-unfetter-sensor':
                            retVal.name = `${r.name} - Sensors`;
                            break;
                        case 'x-unfetter-object-assessment':
                            retVal.name = `${r.name} - Capabilities`;
                            break;
                        default:
                        }
                    }
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
                    detail: 'An unknown error has occurred.'
                }]
            }));
};

/**
 * @description fetch assessments for given creator id, sort base on last modified
 */
const latestAssessmentsByCreatorId = (req, res) => {
    const id = req.swagger.params.creatorId ? req.swagger.params.creatorId.value : '';

    // aggregate pipeline
    //  match on given user and assessment type
    //  group the assessments into its parent rollup id (an assessment can be a combination of 3 types)
    //  unwind the potential 3 assessments per rollup into individual entries
    //  sort on last modified
    const latestAssessmentsByCreatorIdChild = [{
        $match: {
            creator: id,
            'stix.type': 'x-unfetter-assessment',
            'metaProperties.rollupId': { $exists: 1 }
        }
    },
    {
        $project: {
            'stix.assessment_objects': {
                $arrayElemAt: ['$stix.assessment_objects', 0]
            },
            'metaProperties.rollupId': 1,
            'stix.id': 1,
            'stix.name': 1,
            'stix.modified': 1,
            'stix.created_by_ref': 1,
            creator: 1
        }
    },
    {
        $group: {
            _id: '$metaProperties.rollupId',
            rollupId: {
                $first: '$metaProperties.rollupId'
            },
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
                    type: '$stix.assessment_objects.stix.type',
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

    latestAssessmentPromise(latestAssessmentsByCreatorIdChild, req, res);
};

/**
 * @description fetch assessments whereby the created_by_ref is in the current users organizations
 *  , sort base on last modified
 */
const latestAssessments = (req, res) => {
    const orgIds = generateGroupIdsForUser(req.user);
    const matchStage = {
        $match: {
            'stix.type': 'x-unfetter-assessment',
            'metaProperties.rollupId': { $exists: 1 }
        }
    };

    // if not admin, add the security filter
    if (req.user && req.user.role !== 'ADMIN') {
        matchStage.$match['stix.created_by_ref'] = { $in: orgIds };
    }
    // aggregate pipeline
    //  match on given user orgnizations and assessment type
    //  group the assessments into its parent rollup id (an assessment can be a combination of 3 types)
    //  unwind the potential 3 assessments per rollup into individual entries
    //  sort on last modified
    const latestAssessmentsByCreatedByRefs = [
        matchStage,
        {
            $project: {
                'stix.assessment_objects': {
                    $arrayElemAt: ['$stix.assessment_objects', 0]
                },
                'metaProperties.rollupId': 1,
                'stix.id': 1,
                'stix.name': 1,
                'stix.modified': 1,
                'stix.created_by_ref': 1,
                creator: 1
            }
        },
        {
            $group: {
                _id: '$metaProperties.rollupId',
                rollupId: {
                    $first: '$metaProperties.rollupId'
                },
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
                        type: '$stix.assessment_objects.stix.type',
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

    latestAssessmentPromise(latestAssessmentsByCreatedByRefs, req, res);
};

module.exports = {
    add: controller.add(),
    assessedObjects,
    deleteById: controller.deleteById(),
    get: controller.get(),
    getAnswerByAssessedObject,
    getById: controller.getById(),
    getRiskByAssessedObject,
    latestAssessments,
    latestAssessmentsByCreatorId,
    risk,
    riskByAttackPatternAndKillChain,
    riskPerKillChain,
    summaryAggregations,
    update: controller.update(),
    updateAnswerByAssessedObject,
};
