import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as express from 'express';
import * as bodyParser from 'body-parser';

type PromiseResolve = (value: https.Server | PromiseLike<https.Server>) => void;
type PromiseReject = (reason?: any) => void;

function onError(error: any, argv: any, resolve: PromiseResolve, reject: PromiseReject) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = `Port ${argv.port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind, 'requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind, 'is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }

    reject(error);
}

function onListening(server: https.Server, argv: any, resolve: PromiseResolve, reject: PromiseReject) {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    console.log('Listening on ' + bind);
    resolve(server);
}

export default function initializeRESTService(argv: any): Promise<https.Server> {
    const app: any = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    // app.use('/resync/config', configController);
    // app.use('/resync/boards', boardsController);
    app.get('/heartbeat', (req: express.Request, res: express.Response) => {
        res.json({ success: true, service: 'unfetter-threat-ingest', status: 'RUNNING' });
    });

    // catch 404 and forward to error handler
    app.use((req: express.Request, res: express.Response, next: any) => {
        let err = new Error('Not Found');
        if (argv.debug) {
            console.debug('Catching 404 error for endpoint', `(${req.method})`, req.path);
        }
        return res.status(404).json({'error': '404 not found'});
    });

    return new Promise((resolve, reject) => {
        const server: https.Server = https.createServer({
            key: fs.readFileSync(`${argv['cert-dir']}/${argv['server-key']}`),
            cert: fs.readFileSync(`${argv['cert-dir']}/${argv['server-cert']}`)
        }, app);
        server.listen(argv.port);
        server.on('error', (error: any) => onError(error, argv, resolve, reject));
        server.on('listening', () => onListening(server, argv, resolve, reject));
    });
}
