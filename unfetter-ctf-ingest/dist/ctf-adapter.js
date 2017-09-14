"use strict";
exports.__esModule = true;
var kill_chain_phase_1 = require("./models/kill-chain-phase");
var stix_1 = require("./models/stix");
/**
 * @description
 *  Mapping keys from ctf datamodel to stix
 */
var CtfAdapter = /** @class */ (function () {
    function CtfAdapter() {
    }
    CtfAdapter.prototype.convertCtfToStix = function (ctfArray) {
        // "stix" : {
        //     "created" : ISODate("2016-08-01T10:00:00.000Z"),
        //     "modified" : ISODate("2016-08-01T10:00:00.000Z"),
        //     "version" : 0,
        //     "labels" : [],
        //     "external_references" : [ 
        //         {
        //             "url" : "https://attack.mitre.org/wiki/Technique/T1003",
        //             "external_id" : "T1003",
        //             "source_name" : "attack.mitre.org"
        //         }
        //     ],
        //     "granular_markings" : [],
        //     "name" : "Credential Dumping",
        //     "description" : "fafsadfsd
        //     "kill_chain_phases" : [
        //         {
        //             "phase_name" : "credential-access",
        //             "kill_chain_name" : "mitre-attack"
        //         }
        //     ],
        //     "x_unfetter_sophistication_level" : 2,
        //     "type" : "attack-pattern",
        //     "id" : "attack-pattern--0541e9a2-fafa-4ada-8466-cb20f5b021ba"
        // },
        var _this = this;
        var stixies = ctfArray.map(function (ctf) { return _this.mapCtfToStix(ctf); });
        return stixies;
    };
    CtfAdapter.prototype.mapCtfToStix = function (ctf) {
        var stix = new stix_1.Stix();
        stix.type = 'report';
        if (!ctf) {
            return stix;
        }
        if (ctf.title) {
            stix.title = ctf.title;
        }
        var reportId = ctf.reportId;
        var sourceType = ctf.sourceType;
        var description = ctf.description;
        if (reportId || sourceType || description) {
            var externalRef = {
                external_id: ctf.reportId,
                external_url: ctf.reportId,
                source_name: sourceType,
                description: description
            };
            stix.external_references = stix.external_references || [];
            stix.external_references.push(externalRef);
        }
        stix.description = ctf.afaObjective;
        if (ctf.author) {
            stix.created_by_ref = ctf.author;
        }
        if (ctf.reportDtg) {
            stix.created = ctf.reportDtg;
        }
        if (ctf.actionClassification || ctf.reportClassification
            || ctf.declassification) {
            var arr = [ctf.actionClassification,
                ctf.reportClassification, ctf.declassification];
            stix.granular_markings = stix.granular_markings || [];
            stix.granular_markings.concat(arr);
        }
        if (ctf.addedDtg) {
            stix.modified = ctf.addedDtg;
        }
        if (ctf.alaStage) {
            var killChainName = new kill_chain_phase_1.KillChainPhase();
            killChainName.phase_name = ctf.alaStage;
            stix.kill_chain_phases = stix.kill_chain_phases || [];
            stix.kill_chain_phases.push(killChainName);
        }
        stix.name = ctf.afaAction;
        return stix;
    };
    return CtfAdapter;
}());
exports.CtfAdapter = CtfAdapter;
