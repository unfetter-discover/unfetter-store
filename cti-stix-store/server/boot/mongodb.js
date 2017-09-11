'use strict';

/**
 * MongoDB Bootstrap overrides coerceId function to generate random identifiers
 *
 * @module boot/mongodb
 */
module.exports = function(server) {
  for (const dataSourceName in server.dataSources) {
    const dataSource = server.dataSources[dataSourceName];
    if (dataSource.ObjectID) {
      const connector = dataSource.connector;

      connector.coerceId = function(modelName, id) {
        if (id === undefined) {
          const uuid = require('node-uuid');
          const dasherize = require('dasherize');
          const type = dasherize(modelName);
          const random = uuid.v4();
          id = `${type}--${random}`;
        }

        return id;
      };
    }
  }
};
