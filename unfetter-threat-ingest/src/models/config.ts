import * as mongoose from 'mongoose';

const ConfigSchema = new mongoose.Schema({ _id: String }, { strict: false });
ConfigSchema.index({ configKey: 1 });

export const ConfigModel = mongoose.model('Config', ConfigSchema, 'config');
