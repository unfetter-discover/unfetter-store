import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as yargs from 'yargs';
import { DaemonState, StatusEnum, PromisedService } from '../models/server-state';

export type RESTServer = PromisedService<https.Server>;
type PromiseResolve = (value: RESTServer | PromiseLike<RESTServer>) => void;
type PromiseReject = (reason?: any) => void;

const onError = (error: any, state: DaemonState, resolve: PromiseResolve, reject: PromiseReject) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = `Port ${state.configuration.port}`;

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
};

const onListening = (server: https.Server, state: DaemonState, resolve: PromiseResolve, reject: PromiseReject) => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
    resolve(new PromisedService(`Listening on ${bind}`, server));
};

const onHeartbeat = (req: express.Request, res: express.Response, state: DaemonState) => {
    if (state.configuration.debug) {
        console.debug('heartbeat');
    }
    res.json({ success: true, service: 'unfetter-threat-ingest', state: JSON.parse(`${state}`) });
};

const onResyncConfig = (req: express.Request, res: express.Response, state: DaemonState) => {
    if (state.configuration.debug) {
        console.debug('Configuration resync requested');
    }
    if (state.db.refreshTimer) {
        clearTimeout(state.db.refreshTimer);
    }
    state.db.refresh(state);
    res.json({ success: true, configuration: state.configuration })
}

const onResyncBoards = (req: express.Request, res: express.Response, state: DaemonState) => {
    if (state.configuration.debug) {
        console.debug('Threat Feed resync requested');
    }
    if (state.processor.pollTimer) {
        clearTimeout(state.processor.pollTimer);
    }
    state.processor.refresh(state);
    res.json({ success: true, status: state.processor.status })
}

const onShutdown = (state: DaemonState) => {
    if (state.rest.server) {
        state.rest.status.next(StatusEnum.STOPPING);
        state.rest.server.close(() => {
            console.log('Safely shut down REST Service');
            state.rest.status.next(StatusEnum.SHUTDOWN);
            state.rest.server = undefined;
        });
    } else {
        state.rest.status.next(StatusEnum.SHUTDOWN);
    }
}

export default function initializeRESTService(state: DaemonState, options: yargs.Arguments): Promise<RESTServer> {
    state.rest.status.next(StatusEnum.INITIALIZING);

    const app: any = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use('/resync/config', (req: express.Request, res: express.Response) => onResyncConfig(req, res, state));
    app.use('/resync/boards', (req: express.Request, res: express.Response) => onResyncBoards(req, res, state));
    app.get('/heartbeat', (req: express.Request, res: express.Response) => onHeartbeat(req, res, state));

    // catch 404 and forward to error handler
    app.use((req: express.Request, res: express.Response, next: any) => {
        let err = new Error('Not Found');
        if (options.debug) {
            console.debug('Catching 404 error for endpoint', `(${req.method})`, req.path);
        }
        return res.status(404).json({'error': '404 not found'});
    });

    process.on('SIGINT', () => onShutdown(state));
    process.on('SIGTERM', () => onShutdown(state));

    return new Promise((resolve, reject) => {
        const server: https.Server = https.createServer({
            key: fs.readFileSync(`${options['cert-dir']}/${options['server-key']}`),
            cert: fs.readFileSync(`${options['cert-dir']}/${options['server-cert']}`)
        }, app);
        server.on('error', (error: any) => onError(error, state, resolve, reject));
        server.on('listening', () => onListening(server, state, resolve, reject));
        server.listen(options.port);
        state.rest.server = server;
        state.rest.status.next(StatusEnum.RUNNING);
    });
}
