const lodash = require('lodash');

const dbQueryParams = function filterFunc(req) {
  const errors = [];

  let filter;
  try {
    filter = req.swagger.params.filter && req.swagger.params.filter.value ? JSON.parse(req.swagger.params.filter.value) : {};
  } catch (e) {
    errors.push('Cannot parse JSON-encoded filter value.');
  }
  let sort;
  try {
    sort = req.swagger.params.sort && req.swagger.params.sort.value ? JSON.parse(req.swagger.params.sort.value) : {};
  } catch (e) {
    errors.push('Cannot parse JSON-encoded sort value.');
  }
  let limit;
  try {
    limit = req.swagger.params.limit && req.swagger.params.limit.value ? JSON.parse(req.swagger.params.limit.value) : 0;
  } catch (e) {
    errors.push('Cannot parse the limit value.');
  }
  let skip;
  try {
    skip = req.swagger.params.skip && req.swagger.params.skip.value ? JSON.parse(req.swagger.params.skip.value) : 0;
  } catch (e) {
    errors.push('Cannot parse the skip value.');
  }
  let project;
  try {
    project = req.swagger.params.project && req.swagger.params.project.value ? JSON.parse(req.swagger.params.project.value) : 0;
  } catch (e) {
    errors.push('Cannot parse the skip value.');
  }

  if (errors.length > 0) {
    return {
      error: lodash.join(errors, '; ')
    };
  }

  return {
    filter,
    sort,
    limit,
    skip,
    project
  };
};

module.exports = {
  dbQueryParams
};
