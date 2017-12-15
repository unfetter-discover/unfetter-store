import { WSMessage, WSMessageTypes } from '../models/messages';

export interface AppNotification {
    type: string,
    heading: string,
    body: string,
    submitted: Date,
    mongoId: string,
    link?: string
}

export class CreateAppNotification extends WSMessage {
    public mongoId: string;
    constructor(messageType: WSMessageTypes, messageContent: AppNotification, mongoId: string) { 
        super(messageType, messageContent);
        this.mongoId = mongoId;
    }
}
