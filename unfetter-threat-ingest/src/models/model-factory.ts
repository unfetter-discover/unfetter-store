import { Schema, Model, Document } from 'mongoose';
import { ConfigModel } from './config';
import { IdentityModel } from './identity';
import { IntrusionSetModel } from './intrusion-set';
import { MalwareModel } from './malware';
import { ReportModel } from './report';
import { ThreatBoardModel } from './threat-board';
import { UserModel } from './user';

const mongooseModel: any = {};
mongooseModel['config'] = ConfigModel;
mongooseModel['identities'] = IdentityModel;
mongooseModel['intrusion-sets'] = IntrusionSetModel;
mongooseModel['malware'] = MalwareModel;
mongooseModel['reports'] = ReportModel;
mongooseModel['threat-boards'] = ThreatBoardModel;
mongooseModel['users'] = UserModel;

export const getModel = (type: string): Model<Document> => {
    if (mongooseModel[type] !== undefined) {
        return mongooseModel[type];
    }
    console.error(type, 'model not found');
    // TODO add error handling for undefined models
};
