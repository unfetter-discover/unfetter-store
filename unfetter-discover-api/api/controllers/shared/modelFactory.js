const mongoose = require('mongoose');

const mongooseModel = {};
mongooseModel['attack-pattern'] = require('../../models/attack-pattern');
mongooseModel['campaign'] = require('../../models/campaign');
mongooseModel['course-of-action'] = require('../../models/course-of-action');
mongooseModel['identity'] = require('../../models/identity');
mongooseModel['indicator'] = require('../../models/indicator');
mongooseModel['intrusion-set'] = require('../../models/intrusion-set');
mongooseModel['malware'] = require('../../models/malware');
mongooseModel['marking-definition'] = require('../../models/marking-definition');
mongooseModel['observed-data'] = require('../../models/observed-data');
mongooseModel['relationship'] = require('../../models/relationship');
mongooseModel['report'] = require('../../models/report');
mongooseModel['sighting'] = require('../../models/sighting');
mongooseModel['threat-actor'] = require('../../models/threat-actor');
mongooseModel['tool'] = require('../../models/tool');
mongooseModel['x-unfetter-assessment'] = require('../../models/x-unfetter-assessment');
mongooseModel['x-unfetter-control-assessment'] = require('../../models/x-unfetter-control-assessment');
mongooseModel['x-unfetter-sensor'] = require('../../models/x-unfetter-sensor');
mongooseModel['schemaless'] = require('../../models/schemaless');

module.exports = {
    getModel: (type) => {
        if (mongooseModel[type] !== undefined) {
            return mongooseModel[type];
        } else {
            console.error(type, 'model not found');
            // TODO add error handling for undefined models
        }
    },
    getAggregationModel: (type) => {
        const schema = mongoose.Schema({}, {strict: false});

        return mongoose.model(`${type}Aggregations`, schema, type);
    }
};