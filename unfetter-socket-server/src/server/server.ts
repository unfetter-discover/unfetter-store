const port = process.env.PORT || '3333';

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as socketIo from 'socket.io';

import app from './app';
import { mongoInit } from './mongoInit';
import { jwtVerify } from '../middleware/jwtVerify';
import userModel from '../models/mongoose/user';
import { connections } from '../models/connections';
import { WSMessageTypes } from '../models/messages';
import notificationStoreModel from '../models/mongoose/notification-store'
import { NotificationRecieveTypes } from '../models/notifiction-recieve-types.enum';
import { UserRoles } from '../models/user-roles.enum';

mongoInit();

const UNFETTER_OPEN_ID: string = 'identity--e240b257-5c42-402e-a0e8-7b81ecc1c09a';

const server: https.Server = https.createServer({
    key: fs.readFileSync('/etc/pki/tls/certs/server.key'),
    cert: fs.readFileSync('/etc/pki/tls/certs/server.crt')
}, app);

const io: any = socketIo(server, {
    path: '/socket'
});

io.use((client: any, next: any) => {
    let errorMsg = '';

    if (client.handshake.query && client.handshake.query.token) {

        const token = client.handshake.query.token;
        jwtVerify(token)
            .then((user) => {
                if (!user || !user._id) {
                    errorMsg = 'Can not retrieve user ID from token';
                    console.log(errorMsg);
                    next(new Error(errorMsg));
                } else {
                    userModel.findById(user._id, (err, mongoUser: any) => {
                        if (err || !mongoUser) {
                            errorMsg = 'Unable to retrieve user';
                            console.log(errorMsg);
                            next(new Error(errorMsg));
                            client.disconnect();
                        } else {
                            const userObj = mongoUser.toObject();
                            connections.push({
                                user: userObj,
                                token,
                                client,
                                connected: false
                            });
                            console.log(userObj.userName, 'successfully attempted websocket connection');
                            next();
                        }
                    });
                }
            })
            .catch((err) => {
                errorMsg = 'Malformed or invalid token sent';
                console.log(errorMsg);
                next(errorMsg);
                client.disconnect();
            });

    } else {
        errorMsg = 'Token not included in request';
        console.log(errorMsg);
        next(new Error(errorMsg));
        client.disconnect();
    }
});

io.on('connection', (client: any) => {
    console.log('Number of connections on connect: ', connections.length);
    const clientConnection = connections.find((conn) => conn.client === client);

    if (clientConnection) {

        console.log('Client successfully connected');
        clientConnection.connected = true;
        clientConnection.client.send({
            messageType: WSMessageTypes.SYSTEM,
            messageContent: 'Web socket connection successful'
        });

        if (clientConnection.user.role === UserRoles.ADMIN) {
            clientConnection.client.join('admin');
        }

        // Join organization rooms
        // clientConnection.user.organizations
        //     .filter((org: { id: string }) => org.id !== UNFETTER_OPEN_ID)
        //     .filter((org: { approved: boolean }) => !!org.approved)
        //     .forEach((org: { id: string }) => {
        //         console.log(clientConnection.user._id, 'joined', org.id);
        //         clientConnection.client.join(org.id);
        //     });

        // clientConnection.client.on('disconnect', () => {
        //     connections.splice(connections.indexOf(clientConnection), 1);
        //     console.log('Client disconnected');
        //     console.log('Number of connections on disconnect: ', connections.length);
        // });

        clientConnection.client.on('message', (data: any) => {
            const userId = clientConnection.user._id;
            console.log(data);
            switch (data.messageType) {
                case NotificationRecieveTypes.READ_NOTIFICATION:
                    console.log('Reading notification');
                    notificationStoreModel.findByIdAndUpdate(data.messageContent, { $set: { read: true } }, (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Notification read');
                        }
                    });
                    break;
                case NotificationRecieveTypes.DELETE_NOTIFICATION:
                    console.log('Deleting notification');
                    notificationStoreModel.findByIdAndRemove(data.messageContent, (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Notification deleted');
                        }
                    });
                    break;
                case NotificationRecieveTypes.READ_ALL_NOTIFICATIONS:
                    console.log('Reading all notification');
                    notificationStoreModel.update({ userId }, { $set: { read: true } }, { multi: true }, (err, result) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(result);
                            console.log('All notifications read');
                        }
                    });
                    break;
                case NotificationRecieveTypes.DELETE_ALL_NOTIFICATIONS:
                    console.log('Deleting all notification');
                    notificationStoreModel.remove({ userId }, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('All notifications deleted');
                        }
                    });
                    break;                    
                default:
                    console.log('No action for message:\n', data);
            }
        });

    } else {
        console.log('User not found in connections array');
    }    
});

// ~~~ Admin Namespace ~~~

// const adminNamespace: any = io.of('/admin');
// adminNamespace.use((client: any, next: any) => {
//     next();
// });
// adminNamespace.on('connection', (socket: any) => {
//     adminNamespace.send({
//         messageType: WSMessageTypes.SYSTEM,
//         messageContent: 'Test message, this should be deleted from the code!'
//     });
// });

// ~~~ Start Server ~~~

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function onError(error: any) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string' ?
        'pipe ' + addr :
        'port ' + addr.port;
    console.log('Listening on ' + bind);
}

export default io;
