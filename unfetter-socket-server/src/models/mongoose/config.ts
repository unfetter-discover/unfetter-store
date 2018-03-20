import { Schema, Model, model } from 'mongoose';

const configModel: Model<any> = model<any>('config', new Schema({}, { strict: false }), 'config');
export default configModel;
