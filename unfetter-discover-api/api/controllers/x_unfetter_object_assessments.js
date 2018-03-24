const BaseController = require('./shared/basecontroller');

const controller = new BaseController('x-unfetter-object-assessment');

module.exports = {
    get: controller.get(),
    getById: controller.getById(),
    add: controller.add(),
    update: controller.update(),
    deleteById: controller.deleteById()
};
