"use strict";
exports.__esModule = true;
var camelcase = require("camelcase");
var fs = require("fs");
var Papa = require("papaparse");
var ctf_adapter_1 = require("./ctf-adapter");
var ctf_1 = require("./models/ctf");
/**
 * @description reads a well known ctf csv file and converts to stix
 */
var CtfIngest = /** @class */ (function () {
    function CtfIngest() {
    }
    /**
     * @description
     *  reads a well know ctf csv file and converts it to stix objects
     * @param {string} fileName
     */
    CtfIngest.prototype.csvToStix = function (fileName) {
        if (fileName === void 0) { fileName = ''; }
        var arr = this.csvToCtf(fileName);
        var adapter = new ctf_adapter_1.CtfAdapter();
        var stixies = adapter.convertCtfToStix(arr);
        if (stixies && stixies.length > 1) {
            console.log("generated " + stixies.length + " stix objects. Listing first object");
            console.log(stixies[0].toJson());
        }
        return stixies;
    };
    /**
     * @description
     *  reads a well know ctf csv file and loads to csv
     * @throws {Error} if file does not exist
     * @returns {Ctf[]} array of parse object
     */
    CtfIngest.prototype.csvToCtf = function (fileName) {
        var _this = this;
        if (fileName === void 0) { fileName = ''; }
        var parseResults = this.csvToJson(fileName);
        if (parseResults.data) {
            var arr = parseResults.data.map(function (el) { return _this.jsonLineToCtf(el); });
            if (arr && arr.length > 1) {
                console.log("parsed " + arr.length + " objects.  Listing first one");
                console.log(arr[0].toJson());
            }
            return arr;
        }
        return [];
    };
    /**
     * @description
     *  reads this classess csv file and loads to csv
     * @throws {Error} if file does not exist
     * @returns {PapaParse.ParseResult} results from parse
     */
    CtfIngest.prototype.csvToJson = function (fileName) {
        if (fileName === void 0) { fileName = ''; }
        console.log("parse csv to json file = " + fileName);
        if (!fs.existsSync(fileName)) {
            var msg = fileName + " does not exist!";
            throw msg;
        }
        var csvData = fs.readFileSync(fileName).toString();
        var parseResults = Papa.parse(csvData, {
            quoteChar: '"',
            delimiter: ',',
            header: true
        });
        return parseResults;
    };
    /**
     * @description
     *  csv json line to normalized ctf headers
     */
    CtfIngest.prototype.jsonLineToCtf = function (json) {
        var ctf = new ctf_1.Ctf();
        if (!json) {
            return ctf;
        }
        var keys = Object.keys(json);
        keys.forEach(function (key) {
            var camelKey = camelcase(key);
            ctf[camelKey] = json[key];
        });
        return ctf;
    };
    return CtfIngest;
}());
exports.CtfIngest = CtfIngest;
