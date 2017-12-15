import { Schema, Model, model } from 'mongoose';

const notificationStoreSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        required: true
    },
    messageContent: {
        type: Object,
        require: true
    },
    read: {
        type: Boolean,
        default: false
    }
});

const notificationStoreModel: Model<any> = model<any>('notificationStore', notificationStoreSchema, 'notificationStore');
export default notificationStoreModel;
