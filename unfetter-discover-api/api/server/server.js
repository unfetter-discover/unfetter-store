process.env.RUN_MODE = process.env.RUN_MODE || 'DEMO';
const port = process.env.PORT || '3000';

const app = require('../../app');
<<<<<<< 0bcdeabbdbe5339657a4089a66f217d7383e6e9d
const fs = require('fs');
const spdy = require('spdy');
=======
const http = require('http');
>>>>>>> Release 0.3.2 (#49)
const mongoinit = require('./mongoinit.js')();

app.set('port', port);

const server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ?
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
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ?
    'pipe ' + addr :
    'port ' + addr.port;
  console.log('Listening on ' + bind);
}