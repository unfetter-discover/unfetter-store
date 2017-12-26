process.env.SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'socketserver';
process.env.SOCKET_SERVER_PORT = process.env.SOCKET_SERVER_PORT || 3333;

const fetch = require('node-fetch');

const NOTIFICATION_TYPES = [
    'ORGANIZATION',
    'COMMENT'
];

class CreateNotification {
    constructor(userId, notificationType, heading, body, stixId) {
        if (!NOTIFICATION_TYPES.includes(notificationType)) {
            console.log('WARNING, the following notification type is not supported: ', notificationType);
        }
        this.data = {
            attributes: {
                userId,
                notification: {
                    type: notificationType,
                    heading,
                    body,
                    stixId
                }
            }
        };
    }
}

const notifyUser = (userId, notificationType, heading, notificationBody, url = 'user') => {
    const body = JSON.stringify(new CreateNotification(userId, notificationType, heading, notificationBody, null));
    fetch(`https://${process.env.SOCKET_SERVER_URL}:${process.env.SOCKET_SERVER_PORT}/publish/notification/${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body
    })
    .then((res) => {
        console.log('Publish API recieved user notification for', userId);
    })
    .catch((err) => console.log('Error!', err));
};

const updateSocialForAll = (notificationType, notificationBody, stixId, url = 'all') => {
    // TODO restrict update if more strict UAC is added
    const body = JSON.stringify(new CreateNotification(null, notificationType, null, notificationBody, stixId));
    fetch(`https://${process.env.SOCKET_SERVER_URL}:${process.env.SOCKET_SERVER_PORT}/publish/social/${url}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body
    })
    .then((res) => {
        console.log('Publish API recieved notification for social update');
    })
    .catch((err) => console.log('Error!', err));
};

module.exports = {
    notifyUser,
    updateSocialForAll
};
                                        