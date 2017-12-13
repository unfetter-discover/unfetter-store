import { WSMessage, WSMessageTypes } from '../models/messages';

export interface AppNotification {
    type: string,
    heading: string,
    body: string,
    submitted: Date,
    link?: string
}

export class CreateAppNotification extends WSMessage {
    constructor(messageType: WSMessageTypes, messageContent: AppNotification) { 
        super(messageType, messageContent);
    }
}
