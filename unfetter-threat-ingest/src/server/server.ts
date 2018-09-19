import argv from '../services/cli.service';
import initializeMongo from './mongoinit';
import initializeRESTService from './expressinit';

async function startServices() {
    if (argv.debug) {
        console.log('env', process.env);
        console.log('args', argv);
    }

    try {
        const mongoMsg = await initializeMongo(argv);
        console.log('Mongo initialization:', mongoMsg);

        const expressServer = await initializeRESTService(argv);

        // const serverMsg = await serverinit();
        // console.log(serverMsg);
    } catch (error) {
        console.log('Unable to start Threat Feed Service: ', error);
        // process.exit(1);
    }

    process.on('SIGINT', console.log);
    process.on('SIGTERM', console.log);
}

startServices();
