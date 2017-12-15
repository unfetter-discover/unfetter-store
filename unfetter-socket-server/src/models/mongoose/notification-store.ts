import * as mongoose from 'mongoose';

const notificationStoreSchema = new mongoose.Schema({
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
    }
});

const notificationStoreModel: mongoose.Model<any> = mongoose.model<any>('notificationStore', notificationStoreSchema, 'notificationStore');
export default notificationStoreModel;
