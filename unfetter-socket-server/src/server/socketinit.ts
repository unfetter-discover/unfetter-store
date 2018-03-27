import * as socketIo from 'socket.io';
import { Server } from 'https';

import { jwtVerify } from '../middleware/jwtVerify';
import userModel from '../models/mongoose/user';
import { connections } from '../models/connections';
import { Connection } from '../models/connection';
import { WSMessageTypes } from '../models/messages';
import { UserRoles } from '../models/user-roles.enum';
import { NotificationRecieveTypes } from '../models/notifiction-recieve-types.enum';
import notificationStoreModel from '../models/mongoose/notification-store';

export default function socketInit(expressServer: Server) {

    const socketServer: socketIo.Server = socketIo(expressServer, {
        path: '/socket'
    });

    socketServer.use((client: socketIo.Socket, next: any) => {
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

    socketServer.on('connection', (client: socketIo.Socket) => {
        console.log('Number of connections on connect: ', connections.length);
        const clientConnection = connections.find((conn: Connection) => conn.client === client);

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
}
