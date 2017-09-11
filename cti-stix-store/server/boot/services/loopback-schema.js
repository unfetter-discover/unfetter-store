'use strict';

/**
 * Loopback Schema Service for reading JSON Schemas and registering Loopback Models
 *
 */
module.exports = class LoopbackSchemaService {
  /**
   * Load required modules and set default directories
   *
   */
  constructor() {
    this.schemaLocationKey = 'schemaLocation';
    const JsonSchemaService = require('./json-schema');
    const schemaBaseDirectory = `${__dirname}/schemas/stix`;
    this.jsonSchemaService = new JsonSchemaService(schemaBaseDirectory);

    const LoopbackModelService = require('./loopback-model');
    this.loopbackModelService = new LoopbackModelService();
  }

  /**
   * Load Models and attach to Server Data Source when found
   *
   * @param {Object} server Loopback Application
   * @return {undefined}
   */
  loadModels(server) {
    const modelDataSource = this.getModelDataSource(server);

    if (modelDataSource) {
      const jsonSchemaService = this.jsonSchemaService;
      const getModelConfiguration = this.getModelConfiguration.bind(this);


      const schemaLocationPromise = this.getSchemaLocation(server);
      schemaLocationPromise.then(function(schemaLocation) {
        console.log(`Reading Schema [${schemaLocation}]`);
        const schemaPromise = jsonSchemaService.readSchema(schemaLocation);

        schemaPromise.then(function(schema) {
          for (const definitionKey in schema.definitions) {
            const definition = schema.definitions[definitionKey];
            const modelConfiguration = getModelConfiguration(definition, definitionKey);

            if (modelConfiguration.publicModel) {
              console.log(`Registering Model [${modelConfiguration.model.modelName}] Path [${modelConfiguration.model.settings.http.path}]`);
            } else {
              console.log(`Registering Model [${modelConfiguration.model.modelName}]`);
            }

            const modelOptions = {
              dataSource: modelDataSource,
              public: modelConfiguration.publicModel
            };
            server.model(modelConfiguration.model, modelOptions);
          }
        });

        schemaPromise.catch(function(error) {
          console.error(`Unable to read Schema from Location [${schemaLocation}] ${error}: ${error.stack}`);
        });
      });

      schemaLocationPromise.catch(function(error) {
        console.error(`Unable to get Schema Location: ${error}: ${error.stack}`);
      });
    } else {
      console.error('Loopback Data Source with Connector not found');
    }
  }

  /**
   * Get Model Configuration
   *
   * @param {Object} definition Object Definition
   * @param {string} definitionKey Object Definition Key
   * @return Loopback Model Configuration
   */
  getModelConfiguration(definition, definitionKey) {
    const objectDefinition = this.loopbackModelService.getObjectDefinition(definition);
    const model = this.loopbackModelService.getModel(objectDefinition, definitionKey);
    const publicModel = this.loopbackModelService.isPublicModel(objectDefinition);

    if (publicModel) {
      this.disableRemoteMethods(model);
      model.afterJsonApiSerialize = this.afterJsonApiSerializeHandler.bind(this);
      model.beforeJsonApiSerialize = this.beforeJsonApiSerializeHandler.bind(this);
    }

    const modelConfiguration = {
      model: model,
      publicModel: publicModel
    };
    return modelConfiguration;
  }

  /**
   * Get Schema Location
   *
   * @param {Object} server Loopback Server
   * @return {Object} Promise object resolving to Schema Location string
   */
  getSchemaLocation(server) {
    const self = this;
    return new Promise(function(resolve, reject) {
      const configuredSchemaLocation = server.get(self.schemaLocationKey);
      const fs = require('fs');

      if (configuredSchemaLocation) {
        const locationStats = fs.statSync(configuredSchemaLocation);
        if (locationStats.isFile()) {
          console.log(`Using Configured Schema Location File [${configuredSchemaLocation}]`);
          resolve(configuredSchemaLocation);
        } else if (locationStats.isDirectory()) {
          console.log(`Using Configured Schema Location Directory [${configuredSchemaLocation}]`);
          const configuredSchemaDefinitions = self.jsonSchemaService.getSchemaDefinitions(configuredSchemaLocation);
          const schemaPromise = self.jsonSchemaService.getSchema();
          schemaPromise.then(function(schema) {
            for (let key in configuredSchemaDefinitions) {
              schema.definitions[key] = configuredSchemaDefinitions[key];
            }

            const schemaFile = self.writeSchema(schema);
            resolve(schemaFile.name);
          });
          schemaPromise.catch(reject);
        }

      } else {
        const schemaPromise = self.jsonSchemaService.getSchema();
        schemaPromise.then(function(schema) {
          const schemaFile = self.writeSchema(schema);
          resolve(schemaFile.name);
        });
        schemaPromise.catch(reject);
      }
    });
  }

  /**
   * Write Schema to temporary file location
   *
   * @param {Object} schema JSON Schema Object
   * @return {Object} Temporary file descriptor
   */
  writeSchema(schema) {
    const tmp = require('tmp');
    tmp.setGracefulCleanup();

    const schemaFile = tmp.fileSync();
    const schemaString = JSON.stringify(schema);

    console.log(`Writing Default Schema Location [${schemaFile.name}]`);
    const fs = require('fs');
    fs.writeSync(schemaFile.fd, schemaString);
    return schemaFile;
  }

  /**
   * Disable Remote Methods not defined in jsonapi.org specification
   *
   * @param {Object} model Loopback Model
   */
  disableRemoteMethods(model) {
    model.disableRemoteMethodByName('deleteById', true);
    model.disableRemoteMethodByName('createChangeStream', true);
    //model.disableRemoteMethodByName('count', true);
    model.disableRemoteMethodByName('exists', true);
    model.disableRemoteMethodByName('findOne', true);
    model.disableRemoteMethodByName('replaceOrCreate', true);
    model.disableRemoteMethodByName('replaceById', true);
    model.disableRemoteMethodByName('patchOrCreate', true);
    model.disableRemoteMethodByName('upsertWithWhere', true);
    model.disableRemoteMethodByName('updateAll', true);
  }

  /**
   * Before JSON API Serialize Handler converts links to dasherized names
   *
   * @param {Object} options Options
   * @param {function} callback Callback function
   * @return {undefined}
   */
  beforeJsonApiSerializeHandler(options, callback) {
    if (options.results.id) {
      options.dataLinks.self = `${options.topLevelLinks.self}/${options.results.id}`;
    }

    callback(undefined, options);
  }

  /**
   * After JSON API Serialize Handler converts model names to dasherized names
   *
   * @param {Object} options Options
   * @param {function} callback Callback function
   * @return {undefined}
   */
  afterJsonApiSerializeHandler(options, callback) {
    const dasherize = require('dasherize');

    if (Array.isArray(options.results.data)) {
      options.results.data.forEach(function(resource) {
        const resourceType = resource.type;
        resource.type = dasherize(resourceType);
        for (const key in resource.links) {
          const link = resource.links[key];
          resource.links[key] = link.replace(resourceType, resource.type);
        }
      });
    } else {
      const modelName = options.results.data.type;
      const typeName = dasherize(modelName);
      options.results.data.type = typeName;
    }

    callback(undefined, options);
  }

  /**
   * Get Model Data Source from registered Data Sources
   *
   * @param {Object} server Loopback Application
   * @return {Object} Loopback Data Source for Models
   */
  getModelDataSource(server) {
    let modelDataSource;
    if (server.dataSources) {

      for (const dataSourceName in server.dataSources) {
        let dataSource = server.dataSources[dataSourceName];
        if (dataSource.connector) {
          modelDataSource = dataSource;
          console.log(`Model Data Source Found [${dataSourceName}]`);
          break;
        }
      }
    } else {
      console.error('Loopback Data Sources not found');
    }

    return modelDataSource;
  }
};