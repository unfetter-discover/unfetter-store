import * as mongoose from 'mongoose';
import * as configCollection from './config';
// import * as userCollection from './user';
// import * as stixIdentities from './identity';
// import * as stixIndicators from './indicator';
// import * as stixIntrusionSets from './intrusion-set';
// import * as stixMalware from './malware';
// import * as stixReports from './report';
// import * as stixSightings from './sighting';
// import * as stixThreatActors from './threat-actor';
// import * as stixTools from './tool';

const mongooseModel: any = {};
mongooseModel.config = configCollection;
// mongooseModel.identity = require('./identity');
// mongooseModel.indicator = require('./indicator');
// mongooseModel['intrusion-set'] = require('./intrusion-set');
// mongooseModel.malware = require('./malware');
// mongooseModel.sighting = require('./sighting');
// mongooseModel['threat-actor'] = require('./threat-actor');
// mongooseModel.tool = require('./tool');
// mongooseModel.user = require('./user');
// mongooseModel.report = require('./report');

const stixSchema = new mongoose.Schema({}, { strict: false });

const stixAggregationModel = mongoose.model('stixAggregations', stixSchema, 'stix');

export const getModel = (type: string) => {
    if (mongooseModel[type] !== undefined) {
        return mongooseModel[type];
    }
    console.error(type, 'model not found');
    // TODO add error handling for undefined models
};

export const getAggregationModel = (type: string) => {
    if (type === 'stix') {
        return stixAggregationModel;
    }
    const schema = new mongoose.Schema({}, { strict: false });
    return mongoose.model(`${type}Aggregations`, schema, type);
};
