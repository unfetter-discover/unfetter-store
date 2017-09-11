const mongoose = require('mongoose');
const Relationship = require('../models/relationship');
const lodash = require('lodash');
const BaseController = require('./shared/basecontroller');

const apiRoot = 'https://localhost/api';

const controller = new BaseController('relationship');

module.exports = {
    get: controller.get(),
    getById: controller.getById(),
    add: controller.add(),
    update: controller.update(),
    deleteById: controller.deleteById()
};