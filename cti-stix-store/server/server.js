'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

app.start = function() {
  return app.listen(function() {
    app.emit('started');
    var url = app.get('url');
    console.log('Server Started [%s]', url);
  });
};

boot(app, __dirname, function(err) {
  if (err) {
    throw err;
  }

  if (require.main === module) {
    app.start();
  }
});
