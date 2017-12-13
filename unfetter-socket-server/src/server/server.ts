import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as socketIo from 'socket.io';

import app from './app';
import { mongoInit } from './mongoInit';
import { jwtVerify } from '../middleware/jwtVerify';
import { userModel } from '../models/user';
import { connections } from '../models/connections';
import { WSMessageTypes } from '../models/messages';

mongoInit();

const server = https.createServer({
    key: fs.readFileSync('/etc/pki/tls/certs/server.key'),
    cert: fs.readFileSync('/etc/pki/tls/certs/server.crt')
}, app);

const io = socketIo(server, {
    path: '/socket'
});

io.use((client: any, next) => {

    let errorMsg = '';

    if (client.handshake.query && client.handshake.query.token) {

        const token = client.handshake.query.token;
        jwtVerify(token)
            .then((user) => {
                userModel.findById(user._id, (err, mongoUser: any) => {
                    if (err) {
                        errorMsg = 'Unable to retrieve user';
                        console.log(errorMsg);
                        next(new Error(errorMsg));
                        client.disconnect();
                    } else {
                        const userObj = mongoUser.toObject()
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

io.on('connect', (client: any) => {
    console.log('Number of connections on connect: ', connections.length);
    const clientConnection = connections.find((conn) => conn.client === client);

    if (clientConnection) {

        console.log('Client successfully connected');
        clientConnection.connected = true;
        clientConnection.client.send({
            messageType: WSMessageTypes.SYSTEM,
            messageContent: 'Web socket connection successful'
        });
        clientConnection.client.on('disconnect', () => {
            connections.splice(connections.indexOf(clientConnection), 1);
            console.log('Client disconnected');
            console.log('Number of connections on disconnect: ', connections.length);
        });

    } else {
        console.log('User not found in connections array');
    }    
});

server.listen(3333, () => {
    console.log('Server is listening');
});

export default io;
