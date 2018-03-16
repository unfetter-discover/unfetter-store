const port = process.env.PORT || '3000';

const app = require('../../app');
const fs = require('fs');
const spdy = require('spdy');


const onListening = (server, resolveCallBack) => {
    const addr = server.address();
    const bind = typeof addr === 'string' ?
        `pipe ${addr}` : `port ${addr.port}`;
    resolveCallBack(`Server listening on ${bind}`);
};

const onError = (error, rejectCallBack) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string' ?
        `Pipe ${port}` : `Port ${port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case 'EACCES':
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
        break;
    case 'EADDRINUSE':
        console.error(`${bind} is already in use`);
        process.exit(1);
        break;
    default:
        throw error;
    }
    rejectCallBack(error.code);
};

module.exports = () => new Promise((resolve, reject) => {
    global.unfetter = global.unfetter || {};
    if (global.unfetter.httpServer === undefined) {
        app.set('port', port);
        const server = spdy.createServer({
            key: fs.readFileSync('/etc/pki/tls/certs/server.key'),
            cert: fs.readFileSync('/etc/pki/tls/certs/server.crt')
        }, app);
        server.listen(port);
        server.on('error', (error) => onError(error, reject));
        server.on('listening', () => onListening(server, resolve));
        global.unfetter.httpServer = server;
    }
});
