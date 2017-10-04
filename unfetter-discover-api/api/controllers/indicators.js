const BaseController = require('./shared/basecontroller');

const controller = new BaseController('indicator');

module.exports = {
    get: controller.getCb((err, convertedResult, requestedUrl, req, res) => {
        if (req.swagger.params.metaproperties !== undefined && req.swagger.params.metaproperties.value !== undefined && req.swagger.params.metaproperties.value === true) {
            convertedResult.data = convertedResult.map(res => {
                    let temp = res;
                    if (res.attributes !== undefined && res.attributes.kill_chain_phases !== undefined) {
                        temp.attributes.groupings = res.attributes.kill_chain_phases.map((kill_chain_phase) => {
                            let grouping = {};
                            grouping.groupingValue = kill_chain_phase.phase_name;
                            grouping.groupingName = kill_chain_phase.kill_chain_name;
                            return grouping;
                        });
                    }
                    return temp;
                });
        }
        return res.status(200).json({ links: { self: requestedUrl, }, data: convertedResult });
    }),
    getById: controller.getById(),
    add: controller.add(),
    update: controller.update(),
    deleteById: controller.deleteById()
};