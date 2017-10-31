process.env.RUN_MODE = process.env.RUN_MODE || 'DEMO';
const port = process.env.PORT || '3000';

const app = require('../../app');
const spdy = require('spdy');
const mongoinit = require('./mongoinit.js')();
const fs = require('fs');

app.set('port', port);

const server = spdy.createServer({
  key: fs.readFileSync('/etc/pki/tls/certs/server.key'),
  cert: fs.readFileSync('/etc/pki/tls/certs/server.crt')
}, app);

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