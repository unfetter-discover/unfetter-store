import * as mongoose from 'mongoose';

export const userModel = mongoose.model('user', new mongoose.Schema({ }, { strict: false }), 'user');
