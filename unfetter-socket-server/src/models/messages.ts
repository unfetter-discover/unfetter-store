export const enum WSMessageTypes {
    NOTIFICATION = 'NOTIFICATION',
    STIX = 'STIX',
    SYSTEM = 'SYSTEM',
    SOCIAL = 'SOCIAL',
    STIXID = 'STIXID'
}

export interface WSMessage {
    messageType: WSMessageTypes,
    messageContent: any;
}
export abstract class WSMessage {
    public messageType: WSMessageTypes;
    public messageContent: any;
    constructor(messageType: WSMessageTypes, messageContent: any) {
        this.messageType = messageType;
        this.messageContent = messageContent;
    }
}
