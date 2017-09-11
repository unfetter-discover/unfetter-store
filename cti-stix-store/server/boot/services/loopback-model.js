'use strict';

/**
 * Loopback Model Service for converting JSON Schema to Loopback Model Objects
 *
 */
module.exports = class LoopbackModelService {
  /**
   * Load required modules
   *
   */
  constructor() {
    this.loopback = require('loopback');
  }

  /**
   * Get Models from JSON Schema
   *
   * @param {Object} jsonSchema JSON Schema
   * @return Loopback Model bjects
   */
  getModels(jsonSchema) {
    const models = {};

    for (let definitionKey in jsonSchema.definitions) {
      const definition = jsonSchema.definitions[definitionKey];
      const objectDefinition = this.getObjectDefinition(definition);
      const model = this.getModel(objectDefinition, definitionKey, models);
      models[definitionKey] = model;
    }

    return models;
  }

  /**
   * Get Model
   *
   * @param {Object} objectDefinition Object Definition from JSON Schema
   * @param {String} definitionKey Object Definition Key
   * @return Model
   */
  getModel(objectDefinition, definitionKey) {
    const schemaProperties = this.getSchemaProperties(objectDefinition);
    const schemaOptions = this.getSchemaOptions(schemaProperties, definitionKey);
    let model = this.loopback.createModel(definitionKey, schemaProperties, schemaOptions);

    //new delete
    //delete all relationships when the model is deleted
    model.delete = function(id, cb) {
      var app = require('../../server');
      model.destroyById(id, function(mainErr, mainResults) {
        if (mainErr) {
          cb(null, { type: 'Error', message: 'There was an error deleting the model with id ' + id });
        }

        //now destroy the relationships
        var relationship = app.models.Relationship;
        relationship.destroyAll({ or: [{ source_ref: id }, { target_ref: id }] }, function(childErr, childResults) {
          if (childErr) {
            cb(null, { type: 'Error', message: 'There was an error deleting the child objects of model with id: ' + id });
          }

          cb(null, { type: 'Success', message: 'Deleted id ' + id + ' and all corresponding Relationship objects.' });
        });
      })
    };
    model.remoteMethod(
      'delete', {
        http: { path: '/:id', verb: 'delete' },
        accepts: { arg: 'id', http: { source: 'path' }, type: 'string' },
        returns: { arg: 'data', type: 'object' },
      }
    );

    return model;
  }

  /**
   * Is Included determined based on presence of id property
   *
   * @param {Object} objectDefinition Object Definition
   * @return Identified Status
   */
  isPublicModel(objectDefinition) {
    let identified = false;

    if (objectDefinition.properties.id) {
      if (objectDefinition.properties.created) {
        if (objectDefinition.properties.type) {
          if (objectDefinition.properties.type.enum) {
            identified = true;
          }
        }
      }
    }

    return identified;
  }

  /**
   * Get Object Definition from JSON Schema Definition merging inherited properties
   *
   * @param {Object} definition Defintion Object
   * @return Properties Object
   */
  getObjectDefinition(definition) {
    let properties = definition.properties;
    let required = definition.required;

    if (properties === undefined) {
      if (definition.allOf) {
        required = [];
        properties = {};
        definition.allOf.forEach(function(definitionGroup) {
          Object.assign(properties, definitionGroup.properties);

          if (definitionGroup.required) {
            required = required.concat(definitionGroup.required);
          }
        });
      }
    }

    const objectDefinition = {
      properties: properties,
      required: required
    };

    return objectDefinition;
  }

  /**
   * Get Schema Properties
   *
   * @param {Object} objectDefinition Object Definition
   * @return Schema Properties
   */
  getSchemaProperties(objectDefinition) {
    let schemaProperties = Object.assign({}, objectDefinition.properties);

    for (let propertyKey in schemaProperties) {
      let property = schemaProperties[propertyKey];
      if (property.type === 'integer') {
        property.type = 'number';
      }

      if (propertyKey === 'id') {
        property.id = true;
        property.generated = false;
      } else if (objectDefinition.required.indexOf(propertyKey) >= 0) {
        property.required = true;
      }

      if (propertyKey === 'type') {
        delete schemaProperties[propertyKey];
      }

      if (property.type === 'array') {
        if (property.items) {
          if (property.items.type === 'string') {
            schemaProperties[propertyKey] = [String];
          } else if (property.items.type === 'object') {
            const itemObjectDefinition = this.getItemObjectDefinition(property.items);
            schemaProperties[propertyKey] = [itemObjectDefinition];
          }
        }
      }
    }

    return schemaProperties;
  }

  /**
   * Get Item Object Definition
   *
   * @param {Object} itemDefinition JSON Schema Item Definition
   * @return {Object} Item Object Definition for LoopBack Model
   */
  getItemObjectDefinition(itemDefinition) {
    const itemProperties = itemDefinition.properties;

    const itemObjectDefinition = {};
    for (const itemPropertyKey in itemProperties) {
      const itemProperty = itemProperties[itemPropertyKey];
      if (itemProperty.type === 'integer') {
        itemObjectDefinition[itemPropertyKey] = Number;
      } else {
        itemObjectDefinition[itemPropertyKey] = String;
      }
    }

    const itemType = this.getItemObjectType(itemDefinition);
    itemObjectDefinition.type = itemType;

    return itemObjectDefinition;
  }

  /**
   * Get Item Object Type
   *
   * @param {Object} itemDefinition Item Definition
   * @return Item Object Type
   */
  getItemObjectType(itemDefinition) {
    return itemDefinition.title.replace(/ /g, '');
  }

  /**
   * Get Schema Options
   *
   * @param {Object} schemaProperties Schema Properties
   * @param {string} definitionKey Object Definition Key
   * @return Schema Options
   */
  getSchemaOptions(schemaProperties, definitionKey) {
    const schemaOptions = {};

    if (schemaProperties.id) {
      schemaOptions.idInjection = false;
    }

    const httpPath = this.getHttpPath(definitionKey);
    schemaOptions.http = {
      path: httpPath
    };

    return schemaOptions;
  }

  /**
   * Get HTTP Path for Object Definition Key using Pluralized and Dasherized string
   *
   * @param {string} definitionKey Object Definition Key
   * @return HTTP Path pluralized and dasherized from Definition Key
   */
  getHttpPath(definitionKey) {
    const pluralize = require('pluralize');
    const dasherize = require('dasherize');
    const pathKey = pluralize(dasherize(definitionKey));
    return `/${pathKey}`;
  }
};