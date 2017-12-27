import { Schema, Model, model } from 'mongoose';

const userModel: Model<any> = model<any>('user', new Schema({ }, { strict: false }), 'user');
export default userModel;
