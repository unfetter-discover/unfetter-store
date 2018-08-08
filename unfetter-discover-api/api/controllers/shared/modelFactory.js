const mongoose = require('mongoose');

const mongooseModel = {};
mongooseModel['attack-pattern'] = require('../../models/attack-pattern');
mongooseModel.attachmentfiles = require('../../models/attachments').files;
mongooseModel.attachmentchunks = require('../../models/attachments').chunks;
mongooseModel.campaign = require('../../models/campaign');
mongooseModel['course-of-action'] = require('../../models/course-of-action');
mongooseModel.identity = require('../../models/identity');
mongooseModel.indicator = require('../../models/indicator');
mongooseModel['intrusion-set'] = require('../../models/intrusion-set');
mongooseModel.malware = require('../../models/malware');
mongooseModel['marking-definition'] = require('../../models/marking-definition');
mongooseModel['observed-data'] = require('../../models/observed-data');
mongooseModel.relationship = require('../../models/relationship');
mongooseModel.report = require('../../models/report');
mongooseModel.sighting = require('../../models/sighting');
mongooseModel['threat-actor'] = require('../../models/threat-actor');
mongooseModel.tool = require('../../models/tool');
mongooseModel['x-unfetter-assessment'] = require('../../models/x-unfetter-assessment');
mongooseModel['x-unfetter-sensor'] = require('../../models/x-unfetter-sensor');
mongooseModel.schemaless = require('../../models/schemaless');
mongooseModel.config = require('../../models/config');
mongooseModel.user = require('../../models/user');

// Assessments 3.0
mongooseModel['x-unfetter-capability'] = require('../../models/x-unfetter-capability');
mongooseModel['x-unfetter-category'] = require('../../models/x-unfetter-category');
mongooseModel['x-unfetter-assessed-object'] = require('../../models/x-unfetter-assessed-object');
mongooseModel['x-unfetter-assessment-set'] = require('../../models/x-unfetter-assessment-set');
mongooseModel['x-unfetter-assessment-group'] = require('../../models/x-unfetter-assessment-group');
mongooseModel['x-unfetter-object-assessment'] = require('../../models/x-unfetter-object-assessment');

const stixSchema = mongoose.Schema({}, { strict: false });

const stixAggregationModel = mongoose.model('stixAggregations', stixSchema, 'stix');

module.exports = {
    getModel: type => {
        if (mongooseModel[type] !== undefined) {
            return mongooseModel[type];
        }
        console.error(type, 'model not found');
        // TODO add error handling for undefined models
    },
    getAggregationModel: type => {
        if (type === 'stix') {
            return stixAggregationModel;
        }
        const schema = mongoose.Schema({}, { strict: false });

        return mongoose.model(`${type}Aggregations`, schema, type);
    }
};
