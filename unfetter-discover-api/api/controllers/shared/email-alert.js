// NOTE many publish routes will also send Email alerts if an `emailData` object is included
// This is for routes that only have an email alert
process.env.SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'socketserver';
process.env.SOCKET_SERVER_PORT = process.env.SOCKET_SERVER_PORT || 3333;

const fetch = require('node-fetch');

class CreateEmailAlert {
    constructor(userId, userEmail, template, subject, body) {
        this.data = {
            attributes: {
                userId,
                userEmail,
                emailData: {
                    template,
                    subject,
                    body
                }
            }
        };
    }
}

const emailUser = (userId, userEmail, template, subject, emailBody) => {
    const body = JSON.stringify(new CreateEmailAlert(userId, userEmail, template, subject, emailBody));
    fetch(`https://${process.env.SOCKET_SERVER_URL}:${process.env.SOCKET_SERVER_PORT}/publish/email/user`, {
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
}

module.exports = {
    emailUser
};
