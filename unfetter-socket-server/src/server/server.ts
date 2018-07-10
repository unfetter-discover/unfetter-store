import mongoInit from './mongoInit';
import expressInit from './expressinit';
import socketInit from './socketinit';

async function startServer() {
    try {
        const mongoMsg = await mongoInit();
        console.log(mongoMsg);
        const expressServer = await expressInit();
        const socketServer = socketInit(expressServer);
        
    } catch (error) {
        console.log('Unable to start Server: ', error);
        process.exit(1);
    }
}

startServer();
