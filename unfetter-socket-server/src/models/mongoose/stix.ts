import { Schema, Model, model } from 'mongoose';

const stixModel: Model<any> = model<any>('stix', new Schema({}, { strict: false }), 'stix');
export default stixModel;
