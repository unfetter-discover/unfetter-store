'use strict';

/**
 * JSON Schema Service for loading JSON Schema objects from files
 *
 */
module.exports = class JsonSchemaService {
  /**
   * Load required modules and set default directories
   *
   * @param {string} schemaBaseDirectory Base Directory for reading Schemas
   */
  constructor(schemaBaseDirectory) {
    this.defaultTitle = 'JSON Schema';
    this.jsonSchemaUri = 'http://json-schema.org/draft-04/schema#';
    this.fs = require('fs');
    this.refParser = require('json-schema-ref-parser');
    this.schemaBaseDirectory = schemaBaseDirectory;
    this.schemaObjectsDirectory = `${this.schemaBaseDirectory}/objects`;
    this.schemaTypesDirectory = `${this.schemaBaseDirectory}/types`;
  }

  /**
   * Read Schema from location
   *
   * @param {string} schemaLocation Schema Location path or URI
   * @return Promise object resolving to JSON Schema when completed
   */
  readSchema(schemaLocation) {
    return this.refParser.dereference(schemaLocation);
  }

  /**
   * Get Schema parsed from Objects Directory
   *
   * @return Promise object return JSON Schema when completed
   */
  getSchema() {
    const self = this;

    return new Promise(function(resolve, reject) {
      const typesPromise = self.getTypesSchema();

      typesPromise.then(function(typesSchema) {
        const definitions = self.getSchemaDefinitions(self.schemaObjectsDirectory);

        for (let key in definitions) {
          typesSchema.definitions[key] = definitions[key];
        }

        const refPromise = self.refParser.dereference(typesSchema);
        refPromise.then(function(schema) {
          resolve(schema);
        });
        refPromise.catch(function(error) {
          reject(error);
        });
      });

      typesPromise.catch(function(error) {
        reject(error);
      });
    });
  }

  /**
   * Get Types Schema from Types Directory
   *
   * @return Promise object returning bundled JSON Schema of shared type objects when completed
   */
  getTypesSchema() {
    const definitions = this.getSchemaDefinitions(this.schemaTypesDirectory);
    const schema = {
      '$schema': this.jsonSchemaUri,
      title: this.defaultTitle,
      definitions: definitions
    };
    return this.refParser.bundle(schema);
  }

  /**
   * Get Schema Definitions
   *
   * @param {string} directory Directory location for reading JSON Schema documents
   * @return JSON Schema Definitions found in directory
   */
  getSchemaDefinitions(directory) {
    const definitions = {};
    const self = this;
    this.fs.readdirSync(directory).forEach(function(fileName) {
      let filePath = `${directory}/${fileName}`;
      let string = this.fs.readFileSync(filePath, 'utf-8');
      let json = JSON.parse(string);
      let key = self.getDefinitionKey(json);
      if (key) {
        definitions[key] = json;
      }
    }, this);

    return definitions;
  }

  /**
   * Get Definition Key
   *
   * @param {Object} JSON Schema Object
   * @return Object Definition Key based on title property with spaces removed
   */
  getDefinitionKey(object) {
    let key;

    if (object.title) {
      key = object.title.replace(/ /g, '');
    }

    return key;
  }
};
