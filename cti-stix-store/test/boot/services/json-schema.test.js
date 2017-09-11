/* global describe it */
'use strict';

const assert = require('chai').assert;
const JsonSchemaService = require('../../../server/boot/services/json-schema');

const schemaBaseDirectory = `${__dirname}/../../../server/boot/services/schemas/stix`;
const jsonSchemaService = new JsonSchemaService(schemaBaseDirectory);

describe('JsonSchemaService', function() {
  describe('#getSchema', function() {
    it('should return Promise', function() {
      const schemaPromise = jsonSchemaService.getSchema();
      assert.instanceOf(schemaPromise, Promise, 'Promise not found');
    });

    it('should have required properties', function(done) {
      const schemaPromise = jsonSchemaService.getSchema();
      schemaPromise.catch(done);
      schemaPromise.then(function(schema) {
        assert.property(schema, 'definitions', 'definitions not found');
        assert.property(schema, 'title', 'title not found');
        done();
      });
    });
  });

  describe('#getTypesSchema', function() {
    it('should return Promise', function() {
      const typesSchemaPromise = jsonSchemaService.getTypesSchema();
      assert.instanceOf(typesSchemaPromise, Promise, 'Promise not found');
    });

    it('should have required properties', function(done) {
      const typesSchemaPromise = jsonSchemaService.getTypesSchema();
      typesSchemaPromise.catch(done);
      typesSchemaPromise.then(function(typesSchema) {
        assert.property(typesSchema, 'definitions', 'definitions not found');
        assert.property(typesSchema, 'title', 'title not found');
        done();
      });
    });
  });

  describe('#getSchemaDefinitions', function() {
    it('should return definitions object', function() {
      const definitions = jsonSchemaService.getSchemaDefinitions(jsonSchemaService.schemaTypesDirectory);
      assert.isObject(definitions, 'definitions object not found');
    });

    it('should return Common Properties definition', function() {
      const definitions = jsonSchemaService.getSchemaDefinitions(jsonSchemaService.schemaTypesDirectory);
      assert.property(definitions, 'CommonProperties', 'CommonProperties definition not found');
    });
  });

  describe('#getDefinitionKey', function() {
    it('should remove spaces', function() {
      const object = {
        title: 'Object Definition Key'
      };
      const definitionKey = jsonSchemaService.getDefinitionKey(object);

      const expected = 'ObjectDefinitionKey';
      assert.equal(definitionKey, expected, 'spaces not removed');
    });
  });
});
