/**
 * @description - builds the pipeline for an assessment's summary aggregation generation
 * @return Array
 */
const buildSummaryAggregationPipeline = (id = '', isCapability = false) => {
    const initialMatcher = buildAssessmentInitialMatcherPipeline(id);
    // capability vs other assessment types
    const getRelevantAttackPatternInfo = isCapability === true ?
        buildAssessmentCapabilityRelevantAttackPatternInfoPipeline() : buildAssessmentOtherRelevantAttackPatternInfoPipeline();

    const pipeline = [
        ...initialMatcher,
        ...getRelevantAttackPatternInfo,
        {
            $group: {
                _id: '$stix.assessment_objects.stix.id',
                attackPatterns: {
                    $addToSet: {
                        attackPatternId: '$attackPatterns.stix.id',
                        x_unfetter_sophistication_level: '$attackPatterns.extendedProperties.x_unfetter_sophistication_level',
                        kill_chain_phases: '$attackPatterns.stix.kill_chain_phases'
                    }
                }
            }
        }
    ];

    return pipeline;
};

/**
 * @description - builds the pipeline for an assessments attack pattern risk by kill chain
 * @return Array
 */
const buildAttackPatternByKillChainPipeline = (id = '', isCapability = false) => {
    const initialMatcher = buildAssessmentInitialMatcherPipeline(id);
    // capability vs old relationships assessment style datamodel
    const assessmentToAttackPatterns = isCapability === true ?
        buildAssessmentCapabilityToAttackPatternPipeline() : buildAssessmentRelationsToAttackPatternPipeline();

    const pipeline = [
        ...initialMatcher,
        ...assessmentToAttackPatterns,
        {
            $unwind: '$attackPatterns'
        },
        {
            $match: {
                'attackPatterns.stix.type': 'attack-pattern'
            }
        },
        {
            $unwind: '$stix.assessment_objects.questions'
        },
        {
            $group: {
                _id: '$attackPatterns._id',
                assessedObjects: {
                    $addToSet: {
                        assId: '$stix.assessment_objects.stix.id',
                        questions: '$stix.assessment_objects.questions',
                        risk: '$stix.assessment_objects.risk',
                    }
                },
                risk: {
                    $avg: '$stix.assessment_objects.questions.risk'
                },
            }
        },
    ];

    return pipeline;
};

/**
 * @description - builds the pipeline for an assessments attack pattern
 * @return Array
 */
const buildAttackPatternsByPhasePipeline = (id = '', isCapability = false) => {
    const initialMatcher = buildAssessmentInitialMatcherPipeline(id);
    // capability vs old relationships assessment style datamodel
    const assessmentToAttackPatterns = isCapability === true ?
        buildAssessmentCapabilityToAttackPatternPipeline() : buildAssessmentRelationsToAttackPatternPipeline();

    const pipeline = [
        ...initialMatcher,
        ...assessmentToAttackPatterns,
        {
            $unwind: '$attackPatterns'
        },
        {
            $match: {
                'attackPatterns.stix.type': 'attack-pattern'
            }
        },
        {
            $unwind: '$attackPatterns.stix.kill_chain_phases'
        },
        {
            $group: {
                _id: '$attackPatterns.stix.kill_chain_phases.phase_name',
                attackPatterns: {
                    $addToSet: {
                        attackPatternName: '$attackPatterns.stix.name',
                        attackPatternId: '$attackPatterns._id',
                    }
                },
                assessedObjects: {
                    $addToSet: {
                        stix: '$stix.assessment_objects.stix',
                        questions: '$stix.assessment_objects.questions',
                        risk: '$stix.assessment_objects.risk',
                    }
                },
            }
        },
        {
            $sort: {
                _id: 1
            }
        },
    ];

    return pipeline;
};

/**
 * @description - the initial matcher pipeline phase for an assessments query
 * @return Array
 */
const buildAssessmentInitialMatcherPipeline = (id = '') => {
    const initialMatcher = [
        {
            $match: {
                _id: id
            }
        },
        {
            $unwind: '$stix.assessment_objects'
        },
    ];
    return initialMatcher;
};

/**
 * @description - the pipeline phase to take a capability and generate relevant attack pattern info
 * @return Array
 */
const buildAssessmentCapabilityRelevantAttackPatternInfoPipeline = () => {
    const capabilityAssessmentReleventAttackPatternInfo = [
        {
            $lookup: {
                from: 'stix',
                localField: 'stix.assessment_objects.stix.id',
                foreignField: 'stix.id',
                as: 'relationships',
            }
        },
        {
            $unwind: '$relationships'
        },
        {
            $unwind: '$relationships.stix.assessed_objects'
        },
        {
            $match: {
                'relationships.stix.assessed_objects.assessed_object_ref': {
                    $regex: /^attack-pattern.*/
                }
            }
        },
        {
            $lookup: {
                from: 'stix',
                localField: 'relationships.stix.assessed_objects.assessed_object_ref',
                foreignField: 'stix.id',
                as: 'attackPatterns'
            }
        },
        {
            $unwind: '$attackPatterns'
        },
    ];
    return capabilityAssessmentReleventAttackPatternInfo;
};

/**
 * @description - the pipeline phase to take a capability and generated its related attack patterns
 * @return Array
 */
const buildAssessmentCapabilityToAttackPatternPipeline = () => {
    const capabilityAssessmentToAttackPatterns = [
        {
            $lookup: {
                from: 'stix', localField: 'stix.assessment_objects.stix.id', foreignField: 'stix.id', as: 'object_assessments'
            }
        },
        {
            $unwind: '$object_assessments'
        },
        {
            $unwind: '$object_assessments.stix.assessed_objects'
        },
        {
            $project: {
                attackPatterns: '$object_assessments.stix.assessed_objects.assessed_object_ref',
                stix: '$stix',
                object_assessments: '$object_assessments',
            }
        },
        {
            $group: {
                assessmentId: { $addToSet: '$_id' },
                _id: '$attackPatterns',
                stix: { $push: '$stix' },
                object_assessments: { $push: '$object_assessments' },
            }
        },
        {
            $unwind: '$object_assessments',
        },
        {
            $unwind: '$stix',
        },
        {
            $unwind: '$assessmentId',
        },
        {
            $lookup: {
                from: 'stix',
                localField: '_id',
                foreignField: 'stix.id',
                as: 'attackPatterns'
            }
        },
    ];
    return capabilityAssessmentToAttackPatterns;
};

/**
 * @description - the pipeline phase to take non-capability assessment data and generate relevant attack pattern info
 * @returns Array
 */
const buildAssessmentOtherRelevantAttackPatternInfoPipeline = () => {
    const otherAssessmentReleventAttackPatternInfo = [
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
    ];
    return otherAssessmentReleventAttackPatternInfo;
};

/**
 * @description - the pipeline phase to take an assessments relationship objects and generated its retrieve attack patterns
 * @return Array
 */
const buildAssessmentRelationsToAttackPatternPipeline = () => {
    const assessmentRelationshipsToAttackPatterns = [
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
    ];

    return assessmentRelationshipsToAttackPatterns;
};

/**
 * @description - the pipeline to query for attack patterns by kill chain
 * @return Array
 */
const buildAttackPatternsByKillChainPipeline = () => {
    const pipeline = [
        {
            $match: {
                'stix.type': 'attack-pattern',
                $nor: [{
                    'stix.kill_chain_phases': {
                        $exists: false
                    }
                },
                {
                    'stix.kill_chain_phases': {
                        $size: 0
                    }
                },
                ]
            }
        },
        {
            $addFields: {
                kill_chain_phases_copy: '$stix.kill_chain_phases',
            }
        },
        {
            $unwind: '$stix.kill_chain_phases'
        },
        {
            $group: {
                _id: '$stix.kill_chain_phases.phase_name',
                attackPatterns: {
                    $addToSet: {
                        name: '$stix.name',
                        x_unfetter_sophistication_level: '$extendedProperties.x_unfetter_sophistication_level',
                        description: '$stix.description',
                        kill_chain_phases: '$kill_chain_phases_copy',
                        external_references: '$stix.external_references',
                        id: '$stix.id',
                    },
                },
            }
        },
    ];

    return pipeline;
};

module.exports = {
    buildAssessmentCapabilityToAttackPatternPipeline,
    buildAssessmentInitialMatcherPipeline,
    buildAssessmentRelationsToAttackPatternPipeline,
    buildAttackPatternsByPhasePipeline,
    buildAttackPatternByKillChainPipeline,
    buildAttackPatternsByKillChainPipeline,
    buildSummaryAggregationPipeline,
};
