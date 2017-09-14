"use strict";
exports.__esModule = true;
/**
 * @description class to post stix objects to UNFETTER API
 */
var UnfetterPoster = /** @class */ (function () {
    function UnfetterPoster() {
    }
    UnfetterPoster.prototype.uploadStix = function (stix) {
        if (stix === void 0) { stix = []; }
        if (!stix || stix.length < 1) {
            return;
        }
        // const nodePost =
    };
    return UnfetterPoster;
}());
exports.UnfetterPoster = UnfetterPoster;
