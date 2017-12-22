process.env.SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'socketserver';
process.env.SOCKET_SERVER_PORT = process.env.SOCKET_SERVER_PORT || 3333;

const fetch = require('node-fetch');

const NOTIFICATION_TYPES = [
    "ORGANIZATION"
];

class CreateNotification {
    constructor(userId, notificationType, heading, body) {
        if (!NOTIFICATION_TYPES.includes(notificationType)) {
            console.log('WARNING, the following notification type is not supported: ', notificationType);
        }
        this.data = {
            attributes: {
                userId,
                notification: {
                    type: notificationType,
                    heading,
                    body
                }
            }
        };
    }
}

module.exports = (userId, notificationType, heading, notificationBody, url = 'user') => {
    const body = JSON.stringify(new CreateNotification(userId, notificationType, heading, notificationBody));
    fetch(`https://${process.env.SOCKET_SERVER_URL}:${process.env.SOCKET_SERVER_PORT}/publish/notification/${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body
    })
    .then((res) => {
        console.log('Publish API recieved notification for', userId);
    })
    .catch((err) => console.log('Error!', err));
};
                                        