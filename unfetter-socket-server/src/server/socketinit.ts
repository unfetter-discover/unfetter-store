import * as socketIo from 'socket.io';
import { Server } from 'https';

import { jwtVerify } from '../middleware/jwtVerify';
import userModel from '../models/mongoose/user';
import { connections } from '../models/connections';
import { Connection } from '../models/connection';
import { WSMessageTypes } from '../models/messages';
import { UserRoles } from '../models/user-roles.enum';

export default function socketInit(expressServer: Server): SocketIO.Server {

    const socketServer: SocketIO.Server = socketIo(expressServer, {
        path: '/socket'
    });

    socketServer.use((client: SocketIO.Socket, next: any) => {
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
                    next(new Error(errorMsg));
                    client.disconnect();
                });

        } else {
            errorMsg = 'Token not included in request';
            console.log(errorMsg);
            next(new Error(errorMsg));
            client.disconnect();
        }
    });

    socketServer.on('connection', (client: SocketIO.Socket) => {
        console.log(`Number of connections on connect: ${connections.length}`);
        const clientIndex = connections.findIndex((conn: Connection) => conn.client.client.id === client.client.id); 
        const clientConnection = connections[clientIndex] || null;

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

            clientConnection.client.on('disconnect', () => {
                try {
                    console.log(`Removing user ${clientConnection.user._id} socket client ${clientConnection.client.client.id} from connections`);
                    connections.splice(clientIndex, 1);
                    console.log(`Remaining connections: ${connections.length}`);
                } catch (error) {
                    console.log(error);
                }
            });

        } else {
            console.log('User not found in connections array');
        }
    });

    return socketServer;
}
