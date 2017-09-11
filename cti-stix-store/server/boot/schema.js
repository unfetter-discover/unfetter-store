'use strict';

/**
 * Schema Bootstrap loads JSON Schemas and creates Loopback Models
 *
 * @module boot/schema
 */
module.exports = function(server) {
  const LoopbackSchemaService = require('./services/loopback-schema');
  const loopbackSchemaService = new LoopbackSchemaService();
  loopbackSchemaService.loadModels(server);
};