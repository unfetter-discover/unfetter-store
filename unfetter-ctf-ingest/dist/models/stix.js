"use strict";
exports.__esModule = true;
var Stix = /** @class */ (function () {
    function Stix() {
        this.type = 'report';
    }
    Stix.prototype.toJson = function () {
        return JSON.stringify(this, undefined, '\t');
    };
    return Stix;
}());
exports.Stix = Stix;
