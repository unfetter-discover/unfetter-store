'use strict';

/**
 * Trust Proxy Bootstrap for enabling trusted proxy servers
 *
 * @module boot/swagger
 */
module.exports = function(server) {
  server.set('trust proxy', 'loopback, linklocal, uniquelocal');
};
