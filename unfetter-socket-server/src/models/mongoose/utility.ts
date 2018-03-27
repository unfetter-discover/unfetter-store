import { Schema, Model, model } from 'mongoose';

const utilityModel: Model<any> = model<any>('utility', new Schema({ _id: String }, { strict: false }), 'utility');
export default utilityModel;
