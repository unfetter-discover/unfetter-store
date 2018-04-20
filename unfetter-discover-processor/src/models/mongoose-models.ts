import { model, Schema, Model } from 'mongoose';

export default class MongooseModels {
    public static readonly stixModel: Model<any> = model('stix', new Schema({
        _id: String,
        stix: {
            created: Date,
            modified: Date,
            first_seen: Date,
            last_seen: Date,
            published: Date,
            valid_from: Date,
            valid_until: Date,
            first_observed: Date,
            last_observed: Date
        }
    }, {
        strict: false
    }), 'stix');

    public static readonly configModel: Model<any> = model('config', new Schema({
        _id: String
    }, {
        strict: false
    }), 'config');

    public static readonly utilModel: Model<any> = model('utility', new Schema({
        _id: String
    }, {
        strict: false
    }), 'utility');
}
