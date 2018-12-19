process.env.SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'unfetter-socket-server';
process.env.SOCKET_SERVER_PORT = process.env.SOCKET_SERVER_PORT || 3333;

const fetch = require('node-fetch');

const NOTIFICATION_TYPES = [
    'COMMENT',
    'ORGANIZATION',
    'STIX',
    'REPLY',
    'USER_MESSAGE',
    'USER_OBJECT'
];

class CreateNotification {
    constructor(userId, orgId, notificationType, heading, body, stixId, link, emailData) {
        if (!NOTIFICATION_TYPES.includes(notificationType)) {
            console.log('WARNING, the following notification type is not supported: ', notificationType);
        }
        this.data = {
            attributes: {
                userId,
                orgId,
                notification: {
                    type: notificationType,
                    heading,
                    body,
                    stixId,
                    link
                },
                emailData
            }
        };
    }
}

const notifyUser = (userId, notificationType, heading, notificationBody, link = null, emailData = null) => {
    const body = JSON.stringify(new CreateNotification(userId, null, notificationType, heading, notificationBody, null, link, emailData));
    fetch(`https://${process.env.SOCKET_SERVER_URL}:${process.env.SOCKET_SERVER_PORT}/publish/notification/user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body
    })
        .then(res => { // eslint-disable-line no-unused-vars
            console.log('Publish API recieved user notification for', userId);
        })
        .catch(err => console.log('Error!', err));
};

const notifyOrg = (userId, orgId, notificationType, heading, notificationBody, link = null, emailData = null) => {
    const body = JSON.stringify(new CreateNotification(userId, orgId, notificationType, heading, notificationBody, null, link, emailData));
    fetch(`https://${process.env.SOCKET_SERVER_URL}:${process.env.SOCKET_SERVER_PORT}/publish/notification/organization`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body
    })
        .then(res => { // eslint-disable-line no-unused-vars
            console.log('Publish API recieved organization notification for', orgId);
        })
        .catch(err => console.log('Error!', err));
};

const notifyAdmin = (notificationType, heading, notificationBody, link = null, emailData = null) => {
    const body = JSON.stringify(new CreateNotification(null, null, notificationType, heading, notificationBody, null, link, emailData));
    fetch(`https://${process.env.SOCKET_SERVER_URL}:${process.env.SOCKET_SERVER_PORT}/publish/notification/admin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body
    })
        .then(res => { // eslint-disable-line no-unused-vars
            console.log('Publish API recieved admin notification');
        })
        .catch(err => console.log('Error!', err));
};

const updateSocialForAll = (notificationType, notificationBody, stixId) => {
    // TODO restrict update if more strict UAC is added
    const body = JSON.stringify(new CreateNotification(null, null, notificationType, null, notificationBody, stixId, null, null));
    fetch(`https://${process.env.SOCKET_SERVER_URL}:${process.env.SOCKET_SERVER_PORT}/publish/social/all`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body
    })
        .then(res => { // eslint-disable-line no-unused-vars
            console.log('Publish API recieved notification for social update');
        })
        .catch(err => console.log('Error!', err));
};

const sendStixId = (stixId, type) => {
    const body = JSON.stringify(new CreateNotification(null, null, 'STIXID', null, { id: stixId, type }, stixId, null, null));
    fetch(`https://${process.env.SOCKET_SERVER_URL}:${process.env.SOCKET_SERVER_PORT}/publish/stixid/all`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body
    })
        .then(res => { // eslint-disable-line no-unused-vars
            console.log('Publish API recieved notification for stixid update');
        })
        .catch(err => console.log('Error!', err));
};

const updateUserObject = userObject => {
    const body = JSON.stringify(new CreateNotification(userObject._id.toString(), null, 'USER_OBJECT', null, userObject, null, null, null));
    fetch(`https://${process.env.SOCKET_SERVER_URL}:${process.env.SOCKET_SERVER_PORT}/publish/update/user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body
    })
        .then(res => { // eslint-disable-line no-unused-vars
            console.log('Publish API recieved notification for stixid update');
        })
        .catch(err => console.log('Error!', err));
};

module.exports = {
    notifyUser,
    notifyOrg,
    notifyAdmin,
    updateSocialForAll,
    sendStixId,
    updateUserObject
};
