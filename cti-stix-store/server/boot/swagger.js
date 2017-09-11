'use strict';

/**
 * Swagger Bootstrap transforms Swagger Specification when emitted
 *
 * @module boot/swagger
 */
module.exports = function(server) {
  const SwaggerTransformerService = require('./services/swagger-transformer');
  const swaggerTransformerService = new SwaggerTransformerService();
  server.on('swaggerResources', function(swagger) {
    swaggerTransformerService.getSpecification(swagger);
  });
};
