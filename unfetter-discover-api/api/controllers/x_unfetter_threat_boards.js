const BaseController = require('./shared/basecontroller');
const fetch = require('node-fetch');

const controller = new BaseController('x-unfetter-threat-board');

const ingestResync = () => {
    new Promise((resolve, reject) => {
        fetch(`https://${process.env.THREAT_INGEST_URL}:${process.env.THREAT_INGEST_PORT}/resync/boards`)
            .then(() => resolve(true))
            .catch(() => reject(false));
    })
    .then(() => console.debug('threat-ingest-service resync complete'))
    .catch(() => console.debug('threat-ingest-service resync failed'));
};

module.exports = {
    get: controller.get(),
    getById: controller.getById(),
    add: (req, res) => {
        const response = controller.add()(req, res);
        ingestResync();
        return response;
    },
    update: (req, res) => {
        const response = controller.update()(req, res);
        ingestResync();
        return response;
    },
    deleteById: controller.deleteById(),
};
