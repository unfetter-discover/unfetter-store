const port = process.env.PORT || '3333';

import { Server } from 'https';

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import app from './app';

export default function expressInit(): Promise<Server> {
    return new Promise((resolve, reject) => {
        const server: https.Server = https.createServer({
            key: fs.readFileSync('/etc/pki/tls/certs/server.key'),
            cert: fs.readFileSync('/etc/pki/tls/certs/server.crt')
        }, app);

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
            reject(error);
        }

        function onListening() {
            const addr = server.address();
            const bind = typeof addr === 'string' ?
                'pipe ' + addr :
                'port ' + addr.port;
            console.log('Listening on ' + bind);
            resolve(server);
        }
    });
}
