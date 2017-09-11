const mongoose = require('mongoose');
const AttackPattern = require('../models/attack-pattern');
const CourseOfAction = require('../models/course-of-action');
const Relationship = require('../models/relationship');
const IntrusionSet = require('../models/intrusion-set');
const lodash = require('lodash');
const randomColor = require('randomcolor');

const apiRoot = 'https://localhost/api';

const intrusionSetView = function intrusionSetViewFunc(req, res) {

  const id = req.swagger.params.intrusionSetIds.value || '';
  const ids = id ? id.split(',') : [];
  const promises = [];

  // setup the promises
  // 0 - get intrusion sets where ids match
  promises.push(IntrusionSet.find({ _id: { $in: ids }, 'stix.type':'intrusion-set' }));
  // 1 - get a distinct list of kill chain phase names
  promises.push(AttackPattern.distinct('stix.kill_chain_phases.phase_name', {'stix.type': 'attack-pattern'}));
  // 2 - get all attack patterns
  promises.push(AttackPattern.find({'stix.type':'attack-pattern'}));
  // 3 - get all courses of action
  promises.push(CourseOfAction.find({'stix.type':'course-of-action'}));
  // 4 - get all "uses" and "mitigates" relationships
  promises.push(Relationship.find({ 'stix.type': 'relationship', 'stix.relationship_type': { $in: ['uses', 'mitigates'] } }));

  // resolve all the promises
  Promise.all(promises).then((response) => {
    const matchedIntrusionSets = response[0].map(result => result.toObject().stix);
    const distinctKillChainPhaseNames = response[1];
    const allAttackPatterns = response[2].map(result => result.toObject().stix);
    const allCoursesOfAction = response[3].map(result => result.toObject().stix);
    const allUsesAndMitigatesRelationships = response[4].map(result => result.toObject().stix);

    // setup the instrusion sets by adding the attack patterns to each one
    const intrusionSets = [];
    lodash.forEach(matchedIntrusionSets, (intrusionSet) => {
      // neet to convert to object since we're dealing with a mongo model, which is immutable
      const intrusionSetObj = intrusionSet;
      intrusionSetObj.color = randomColor();
      intrusionSetObj.attack_patterns = [];
      lodash.forEach(allUsesAndMitigatesRelationships, (relationship) => {
        if (relationship.source_ref === intrusionSet.id && relationship.relationship_type === 'uses' && relationship.target_ref.startsWith('attack-pattern--')) {
          intrusionSetObj.attack_patterns.push(
            lodash.find(allAttackPatterns, (obj) => {
              const apMatch = obj.id === relationship.target_ref;
              return apMatch;
            })
          );
        }
      });
      intrusionSets.push(intrusionSetObj);
    });
    // add intrusion sets to attack patterns
    const allAttackPatternsWithIntrusionSets = [];
    // for each attack pattern, add any intrusion sets that use it
    lodash.forEach(allAttackPatterns, (attackPattern) => {
      // neet to convert to object since we're dealing with a mongo model, which is immutable
      const attackPatternObj = attackPattern;
      attackPatternObj.intrusion_sets = [];
      lodash.forEach(intrusionSets, (intrusionSet) => {
        const found = lodash.some(intrusionSet.attack_patterns, intrusionSetAttackPattern =>
          intrusionSetAttackPattern.id === attackPattern.id
        );
        if (found) {
          attackPatternObj.intrusion_sets.push(
            {
              name: intrusionSet.name,
              color: intrusionSet.color
            }
          );
        }
      });
      allAttackPatternsWithIntrusionSets.push(attackPatternObj);
    });
    // setup the kill chain phases response by adding the attack patterns to each one
    // (attack patterns can belong to more than one kill chain phase)
    const killChainPhases = [];
    lodash.forEach(distinctKillChainPhaseNames, (phaseName) => {
      const aps = lodash.filter(allAttackPatternsWithIntrusionSets, (attackPattern) => {
        const found = lodash.some(attackPattern.kill_chain_phases, (phase) => {
          const phaseMatch = phase.phase_name === phaseName;
          return phaseMatch;
        });
        return found;
      });
      killChainPhases.push(
        {
          name: phaseName,
          attack_patterns: aps,
        });
    });
    // setup the courses of action by adding the attack patterns to each one
    // only add courses of action that have an attack pattern used by the selected intrusion sets
    const coursesOfAction = [];
    const usedAttackPatterns = [];
    lodash.forEach(intrusionSets, (obj) => {
      usedAttackPatterns.push(...obj.attack_patterns);
    });
    const uniqueUsedAttackPatterns = lodash.uniqBy(usedAttackPatterns, 'id');
    lodash.forEach(allCoursesOfAction, (coa) => {
      const coaObj = coa;
      const coaAps = lodash.filter(uniqueUsedAttackPatterns, (uniqueAttackPattern) => {
        const found = lodash.find(allUsesAndMitigatesRelationships, (obj) => {
          const refMatch = obj.source_ref === coa.id &&
            obj.target_ref === uniqueAttackPattern.id;
          return refMatch;
        });
        return found;
      });
      if (coaAps.length > 0) {
        coaObj.attack_patterns = coaAps;
        coursesOfAction.push(coaObj);
      }
    });

    const requestedUrl = apiRoot + req.originalUrl;
    res.header('Content-Type', 'application/json');
    res.json({
      data: {
        intrusionSets,
        killChainPhases,
        coursesOfAction,
        totalAttackPatterns: allAttackPatterns.length,
      },
      links: {
        self: requestedUrl,
      },
    });
  });
};

module.exports = {
  intrusionSetView,
};

