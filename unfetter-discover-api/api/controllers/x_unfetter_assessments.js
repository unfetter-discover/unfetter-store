const modelFactory = require('./shared/modelFactory')
const lodash = require('lodash');
const parser = require('../helpers/url_parser');
const stix = require('../helpers/stix');
const jsonApiConverter = require('../helpers/json_api_converter');
const BaseController = require('./shared/basecontroller');
const XUnfetterAssessment = modelFactory.getModel('x-unfetter-assessment');
const mongoose = require('mongoose');

const controller = new BaseController('x-unfetter-assessment');
const returnProps = ['indicators', 'sensors', 'courseOfActions'];
const ASSESSED_OBJECT_TYPES = ['indicator', 'x-unfetter-sensor', 'course-of-action', ];
const apiRoot = 'https://localhost/api';
const models = {};

ASSESSED_OBJECT_TYPES.forEach(assessedObjectType => models[assessedObjectType] = modelFactory.getModel(assessedObjectType));
models['attack-pattern'] = modelFactory.getModel('attack-pattern');

const aggregationModel = modelFactory.getAggregationModel('stix');

// REUSAGE FUNCTIONS
// These functions are reused among multiple api calls

// Give a set of assessments, returns the total risk level
function calculateRiskByQuestion(assessments) {
  const questions = [];
  let total = 0;
  let count = 0;
  lodash.forEach(assessments, (assessment) => {
    lodash.forEach(assessment.questions, (currentQuestion) => {
      total += currentQuestion.risk;
      count += 1;
      const foundQuestion = questions.find(function (object) {
        return object.name === currentQuestion.name;
      });
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
  lodash.forEach(questions, (question) => {
    question.risk /= question.total;
  });
  returnObject.questions = questions;
  return returnObject;
}

function getPromises(assessment) {

  let assessedObjectIDs = {};
  assessment.stix.assessment_objects
    .map(assessmentObj => assessmentObj.stix)
    .forEach(assessmentObj => {
      if (assessedObjectIDs[assessmentObj.type] === undefined) {
        assessedObjectIDs[assessmentObj.type] = [];
      }
      assessedObjectIDs[assessmentObj.type].push(assessmentObj.id);
    });

  // Generate promises using the ASSESSED_OBJECT_TYPES enum so Promise.all methods get the return in the order expected
  // Don't bother running a mongo query for empty objects
  let promises = [];
  ASSESSED_OBJECT_TYPES.forEach(assessedObjectType => {
    let assessedPromise;
    if (assessedObjectIDs[assessedObjectType] === undefined || assessedObjectIDs[assessedObjectType].length === 0) {
      assessedPromise = Promise.resolve([]);
    } else {
      assessedPromise = models[assessedObjectType].find({
        _id: {
          $in: assessedObjectIDs[assessedObjectType]
        }
      });
    }
    promises.push(assessedPromise);
  });
  return promises;
}

const assessedObjects = controller.getByIdCb((err, result, req, res, id) => {
  const assessment = result[0];

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
    .then((results) => {
      let returnObject = [];

      returnProps.forEach((returnProp, i) => {

        let temp = results[i].map(stix => {

          let stixObj = stix.toObject();
          let assessedData = lodash.find(assessment.assessment_objects, assessmentObject => assessmentObject.stix.id === stix._id);
          if (assessedData !== null && assessedData !== undefined && assessedData.risk !== undefined) {
            stixObj['risk'] = assessedData.risk;
          }
          return stixObj;
        });
        returnObject = returnObject.concat(temp);
      });

      const requestedUrl = apiRoot + req.originalUrl;
      res.header('Content-Type', 'application/json');
      res.json({
        data: returnObject,
        links: {
          self: requestedUrl,
        },
      });
    })
    .catch(promiseErr => {
      return res.status(500).json({
        errors: [{
          status: 500,
          source: '',
          title: 'Error',
          code: '',
          detail: 'An unknown error has occurred.'
        }]
      });
    });
});

// Takes a set of Kill Chain phase names, and groups the STIX objects.
function groupByKillChain(distinctKillChainPhaseNames, objects) {
  const killChainPhases = [];
  lodash.forEach(distinctKillChainPhaseNames, (phaseName) => {
    const aps = lodash.filter(objects, (object) => {
      // If "phase" is found in any of object.kill_chain_phases....
      const found = lodash.some(object.kill_chain_phases, (phase) => {
        const phaseMatch = phase.phase_name === phaseName;
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
function calculateRiskPerKillChain(workingObjects) {
  const killChains = lodash.sortBy(lodash.uniqBy(lodash.flatMap(lodash.flatMapDeep(workingObjects, 'kill_chain_phases'), 'phase_name')));
  const groupedObjects = groupByKillChain(killChains, workingObjects);
  const returnObjects = [];
  lodash.forEach(groupedObjects, (killChainGroup) => {
    const returnObject = calculateRiskByQuestion(killChainGroup.objects);
    returnObject.objects = killChainGroup.objects;
    returnObject.phaseName = killChainGroup.name;
    returnObjects.push(returnObject);
  });
  return returnObjects;
}

// Will group assessed objects into Attack Kill Chains, and calculates the risks
// The data is not json-api 

const riskPerKillChain = controller.getByIdCb((err, result, req, res, id) => {

  let assessment = result[0];

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
    .then((results) => {
      assessment = assessment.toObject().stix;
      const indicators = results[0].map(doc => doc.toObject().stix);
      const indicatorRisks = [];
      const sensors = results[1].map(doc => doc.toObject().stix);
      const sensorRisks = [];
      const courseOfActions = results[2].map(doc => doc.toObject().stix);
      const coaRisks = [];
      const returnObject = {};
      returnObject.indicators = [];
      returnObject.sensors = [];
      returnObject.courseOfActions = [];
      lodash.forEach(indicators, (stix) => {
        const assessedObject = lodash.find(assessment.assessment_objects, function (o) {
          return o.stix.id === stix.id;
        });
        const stixObject = stix;
        stixObject.risk = assessedObject.risk;
        stixObject.questions = assessedObject.questions;
        indicatorRisks.push(stixObject);
      });
      lodash.forEach(courseOfActions, (stix) => {
        const assessedObject = lodash.find(assessment.assessment_objects, function (o) {
          return o.stix.id === stix.id;
        });
        const stixObject = stix;
        stixObject.risk = assessedObject.risk;
        stixObject.questions = assessedObject.questions;
        coaRisks.push(stixObject);
      });
      lodash.forEach(sensors, (stix) => {
        const assessedObject = lodash.find(assessment.assessment_objects, function (o) {
          return o.stix.id === stix.id;
        });
        const stixObject = stix;
        stixObject.risk = assessedObject.risk;
        stixObject.questions = assessedObject.questions;
        sensorRisks.push(stixObject);
      });
      if (indicators.length > 0) {
        returnObject.indicators = calculateRiskPerKillChain(indicatorRisks);
      }
      if (sensors.length > 0) {
        returnObject.sensors = calculateRiskPerKillChain(sensorRisks);
      }

      if (courseOfActions.length > 0) {
        returnObject.courseOfActions = calculateRiskPerKillChain(coaRisks);
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
const risk = controller.getByIdCb((err, result, req, res, id) => {

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

// TODO
// Given a phase name of a Kill Chain, return all assessements for that Kill Chain
// An Attack Pattern has a kill chain.  Indicators, Sensors and COA have also been given
// kill chains to allow them to be grouped.  This function will return all the assessment
// for ATTACK Kill Chains
const riskByAttackPatternAndKillChain = function killChain(req, res) {
  const id = req.swagger.params.id ? req.swagger.params.id.value : '';

  let attackPatternAggregations = [{
      $match: {
        _id: id
      } // place id here
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
        // TODO remove this avgRisk is wrong
        // avgRisk: {
        //   $avg: '$stix.assessment_objects.risk'
        // },
      }
    },
    {
      $sort: {
        _id: 1
      }
    },
  ];

  let assessedByAttackPattern = [{
      $match: {
        _id: id
      } // place id here
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
            'assId': '$stix.assessment_objects.stix.id',
            'questions': '$stix.assessment_objects.questions',
            'risk': '$stix.assessment_objects.risk',
          }
        },
        risk: {
          $avg: '$stix.assessment_objects.questions.risk'
        },
      }
    },
  ];

  let attackPatternsByKillChain = [{
      $match: {
        "stix.type": "attack-pattern",
        $nor: [{
            "stix.kill_chain_phases": {
              $exists: false
            }
          },
          {
            "stix.kill_chain_phases": {
              $size: 0
            }
          },
        ]
      }
    },
    {
      $addFields: {
        "kill_chain_phases_copy": "$stix.kill_chain_phases",
      }
    },
    {
      $unwind: "$stix.kill_chain_phases"
    },
    {
      $group: {
        _id: "$stix.kill_chain_phases.phase_name",
        "attackPatterns": {
          $addToSet: {
            name: "$stix.name",
            x_unfetter_sophistication_level: "$stix.x_unfetter_sophistication_level",
            description: "$stix.description",
            kill_chain_phases: "$kill_chain_phases_copy",
            external_references: "$stix.external_references",
            id: "$stix.id",
          },
        },
      }
    },
  ];

  Promise.all([
      aggregationModel.aggregate(attackPatternAggregations),
      aggregationModel.aggregate(assessedByAttackPattern),
      aggregationModel.aggregate(attackPatternsByKillChain),
    ])
    .then(results => {
      if (results) {
        const requestedUrl = apiRoot + req.originalUrl;
        const returnObj = {};
        returnObj.phases = results[0];

        // TODO remove this, this is incorrect
        // returnObj.totalRisk = results[0]
        //   .map(res => res.avgRisk)
        //   .reduce((prev, cur) => cur += prev, 0)
        //   / results[0].length;

        returnObj.assessedByAttackPattern = results[1];
        returnObj.attackPatternsByKillChain = results[2];

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
    .catch(err =>
      res.status(500).json({
        errors: [{
          status: 500,
          source: '',
          title: 'Error',
          code: '',
          detail: 'An unknown error has occurred.'
        }]
      })
    );
};

const summaryAggregations = (req, res) => {
  const id = req.swagger.params.id ? req.swagger.params.id.value : '';

  let attackPatternsByAssessedObject = [{
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
        'attackPatterns.stix.x_unfetter_sophistication_level': {
          $ne: null
        }
      }
    },
    {
      $group: {
        _id: '$stix.assessment_objects.stix.id',
        'attackPatterns': {
          $addToSet: {
            'attackPatternId': '$attackPatterns.stix.id',
            'x_unfetter_sophistication_level': '$attackPatterns.stix.x_unfetter_sophistication_level',
            'kill_chain_phases': '$attackPatterns.stix.kill_chain_phases'
          }
        },
      }
    },
  ];

  Promise.all([
    aggregationModel.aggregate(attackPatternsByAssessedObject),
    models['attack-pattern'].find({'stix.x_unfetter_sophistication_level': {'$ne': null}}),
  ])
  .then(results => {
    if (results) {
      const requestedUrl = apiRoot + req.originalUrl;
      const returnObj = {};
      let tempAttackPatternsByAssessedObject = results[0];
      let allAttackPattenrns = results[1];
      let sophisticationSetMap = {};

      // Push assessed attack patterns to a set by sophisication level
      tempAttackPatternsByAssessedObject.forEach(tempAttackPatternByAssessedObject => {
        tempAttackPatternByAssessedObject.attackPatterns.forEach(ap => {
          if (sophisticationSetMap[ap.x_unfetter_sophistication_level] === undefined) {
            sophisticationSetMap[ap.x_unfetter_sophistication_level] = new Set();
          }
          sophisticationSetMap[ap.x_unfetter_sophistication_level].add(ap.attackPatternId);
        });
      });

      let sophisticationTallyMap = {};
      // Tally up set sizes to get count by sophisication level
      for (let level in sophisticationSetMap) {
        sophisticationTallyMap[level] = sophisticationSetMap[level].size;
      }

      let allAttackPatternTallyMap = {};
      // Map all attack pattern to a total tally
      allAttackPattenrns.forEach(ap => {
        if (allAttackPatternTallyMap[ap['stix']['x_unfetter_sophistication_level']] === undefined) {
          allAttackPatternTallyMap[ap['stix']['x_unfetter_sophistication_level']] = 0;
        }
        ++allAttackPatternTallyMap[ap['stix']['x_unfetter_sophistication_level']];
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
  .catch(err =>
    res.status(500).json({
      errors: [{
        status: 500,
        source: '',
        title: 'Error',
        code: '',
        detail: 'An unknown error has occurred.'
      }]
    })
  );
};



// Get the total Risk of a single Assessed Object of a certain Assessed Object
const getRiskByAssessedObject = controller.getByIdCb((err, result, req, res, id) => {
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
  let assessed_object = result[0].stix.assessment_objects.find(o => o.stix.id == objectId);
  const returnObject = assessed_object.risk;
  const requestedUrl = apiRoot + req.originalUrl;
  res.header('Content-Type', 'application/json');
  res.json({
    data: returnObject,
    links: {
      self: requestedUrl,
    },
  });
});

// Get the total Risk of a single Assessed Object of a certain Assessed Object
const getAnswerByAssessedObject = controller.getByIdCb((err, result, req, res, id) => {
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
  let assessed_object = result[0].stix.assessment_objects.find(o => o.stix.id == objectId);
  const returnObject = assessed_object.questions[questionNumber].selected_value;
  const requestedUrl = apiRoot + req.originalUrl;
  res.header('Content-Type', 'application/json');
  res.json({
    data: returnObject,
    links: {
      self: requestedUrl,
    },
  });
});


// With a given assessmentID, and assessedObjectId, and a new answer value, go through the questions
//   of that assessed object and give the new answers.  
//   Recalculate the updated risks.
//    Updates mongo with the new values

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
  }
  
  //  The ObjectId is the assessed Object id.  Indicator, sensor or mitigations, more likely
  const objectId = req.swagger.params.objectId ? req.swagger.params.objectId.value : '';
  //  The answer is a value of the index of the answer to select for each question.  We assume
  //  we are changing all the values back to the same answer.
  
  const answer = req.swagger.params.data.value.data.attributes.answer ? req.swagger.params.data.value.data.attributes.answer : 0;
  const questionId = req.swagger.params.question ? req.swagger.params.question.value : "";
  
  // answer should be an integer to represent an index value of the array of question options.
  if ((answer >= 0)) {
    const assessment = result[0];
    // The array of assessed objects
    let assessed_object = assessment.stix.assessment_objects.find(o => o.stix.id == objectId);
    
    // go through and change the answer to each of these questions.
    let risk = 0;

    lodash.forEach(assessed_object.questions, (question, index) => {

      if ((answer <= question.options.length) && ((questionId=="") || (questionId == index))) {
        question.selected_value = question.options[answer];
        risk += question.selected_value.risk;
        question.risk = question.selected_value.risk;
      }
    });
    assessed_object.risk = risk/assessed_object.questions.length;
    

    // Update the Mongoose model
    try {
      const model = modelFactory.getModel(assessment.stix.type);  
      const newDocument = new model(assessment);
      const error = newDocument.validateSync();
      if (error) {
        const errors = [];
        lodash.forEach(error.errors, (field) => {
            errors.push(field.message);
        });
        return res.status(400).json({ errors: [{ status: 400, source: '', title: 'Error', code: '', detail: errors }] });
      }
      model.findOneAndUpdate({ _id: id }, newDocument, { new: true }, (errUpdate, resultUpdate) => {

        if (errUpdate) {
            return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
        }

        if (resultUpdate) {
            const requestedUrl = apiRoot + req.originalUrl;
            const convertedResult = jsonApiConverter.convertJsonToJsonApi(resultUpdate.stix, assessment.stix.type, requestedUrl);
            return res.status(200).json({ links: { self: requestedUrl, }, data: convertedResult });
        }

        return res.status(404).json({ message: `Unable to update the item.  No item found with id ${id}` });
      });
    }
    catch (err) {
      console.log("error "+err);
      return res.status(500).json({ errors: [{ status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.' }] });
    }



   // console.log(JSON.stringify(assessment, null, 4));
   // const returnObject = assessed_object.questions[0].selected_value;
   // const requestedUrl = apiRoot + req.originalUrl;
   // res.header('Content-Type', 'application/json');
   // res.json({
   //   data: returnObject,
   //   links: {
   //     self: requestedUrl,
   //   },
    
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
    
module.exports = {
  get: controller.get(),
  getById: controller.getById(),
  add: controller.add(),
  update: controller.update(),
  deleteById: controller.deleteById(),
  assessedObjects,
  risk,
  riskPerKillChain,
  riskByAttackPatternAndKillChain,
  summaryAggregations,
  getRiskByAssessedObject,
  getAnswerByAssessedObject,
  updateAnswerByAssessedObject,
};