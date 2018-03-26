const relationshipModel = require('../models/relationship');
const stixSchemaless = require('../models/schemaless');
const BaseController = require('./shared/basecontroller');

const controller = new BaseController('relationship');

module.exports = {
    get: controller.get(),
    getById: controller.getById(),
    add: controller.add(),
    update: controller.update(),
    deleteById: controller.deleteByIdCb((req, res, id) => {
        relationshipModel.findByIdAndRemove(id, (err, result) => {
            if (err) {
                res.status(500).json({
                    errors: [{
                        status: 500, source: '', title: 'Error', code: '', detail: 'An unknown error has occurred.'
                    }]
                });
            } else if (!result) {
                return res.status(404).json({ message: `Unable to delete the item.  No item found with id ${id}` });
            } else {
                const deletedRelationship = result.toObject();
                const sourceId = deletedRelationship.stix.source_ref;
                const targetId = deletedRelationship.stix.target_ref;

                // Confirm we have two IDs to query for
                if (sourceId && targetId) {
                    stixSchemaless.find({ $or: [{ _id: sourceId }, { _id: targetId }] }, (err, results) => {
                        if (results.length === 2) {
                            // TODO handle deletion of a relationship when both related objects still exist
                            console.log('Both related objects still exist');
                            return res.status(200).json({ data: { type: 'Success', message: `Deleted id ${id}` } });
                        }
                        return res.status(200).json({ data: { type: 'Success', message: `Deleted id ${id}` } });
                    });
                } else {
                    return res.status(200).json({ data: { type: 'Success', message: `Deleted id ${id}` } });
                }
            }
        });
    })
};
