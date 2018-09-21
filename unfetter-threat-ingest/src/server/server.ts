import { combineLatest } from 'rxjs';
import argv from '../services/cli.service';
import initializeMongo from './mongoinit';
import initializeRESTServer from './expressinit';
import initializeProcessor from './processinit';
import { DaemonState, StatusEnum } from '../models/server-state';

const onShutdown = (state: DaemonState) => {
    state.status = StatusEnum.STOPPING;
    combineLatest(state.db.status, state.rest.status, state.processor.status).subscribe(
        (componentStates: [StatusEnum, StatusEnum, StatusEnum]) => {
            if (componentStates.every((s: StatusEnum) => s === StatusEnum.SHUTDOWN)) {
                console.log('Threat Feed Service terminated.');
                state.status = StatusEnum.SHUTDOWN;
                process.exit();
            } else {
                setTimeout(() => onShutdown(state), 50);
            }
        },
        (err: any) => console.log('Shutdown state error', err)
    );
};

async function startServices() {
    if (argv.debug) {
        console.log('env', process.env);
        console.log('args', argv);
    }

    const state: DaemonState = new DaemonState();
    state.status = StatusEnum.INITIALIZING;

    process.on('SIGINT', () => { onShutdown(state); });
    process.on('SIGTERM', () => { onShutdown(state); });

    try {
        const mongoService = await initializeMongo(state, argv);
        console.log('Mongo initialization:', mongoService.response);

        const expressServer = await initializeRESTServer(state, argv);
        console.log('REST Server initialization:', expressServer.response);

        const processor = await initializeProcessor(state, argv);
        console.log('Ingest Processor initilization:', processor.response);

        state.status = StatusEnum.RUNNING;
    } catch (error) {
        console.log('Unable to start Threat Ingest Daemon: ', error);
        process.exit(1);
    }
}

startServices();
