const fs = require('fs');
const fetch = require('node-fetch');
const process = require('process');
const mongoose = require('mongoose');

const StixSchema = new mongoose.Schema({ _id: String }, { strict: false });
const AttackPattern = mongoose.model('AttackPattern', StixSchema, 'AttackPattern');
const CourseOfAction = mongoose.model('CourseOfAction', StixSchema, 'CourseOfAction');
const Campaign = mongoose.model('Campaign', StixSchema, 'Campaign');
const Indicator = mongoose.model('Indicator', StixSchema, 'Indicator');
const Identity = mongoose.model('Identity', StixSchema, 'Identity');
const IntrusionSet = mongoose.model('IntrusionSet', StixSchema, 'IntrusionSet');
const Malware = mongoose.model('Malware', StixSchema, 'Malware');
const MarkingDefinition = mongoose.model('MarkingDefinition', StixSchema, 'MarkingDefinition');
const ObservedData = mongoose.model('ObservedData', StixSchema, 'ObservedData');
const Relationship = mongoose.model('Relationship', StixSchema, 'Relationship');
const Sighting = mongoose.model('Sighting', StixSchema, 'Sighting');
const ThreatActor = mongoose.model('ThreatActor', StixSchema, 'ThreatActor');
const Tool = mongoose.model('Tool', StixSchema, 'Tool');
const Report = mongoose.model('Report', StixSchema, 'Report');
const XUnfetterControlAssessment = mongoose.model('XUnfetterControlAssessment', StixSchema, 'XUnfetterControlAssessment');
const XUnfetterSensor = mongoose.model('XUnfetterSensor', StixSchema, 'XUnfetterSensor');
const model = mongoose.model('stix', StixSchema, 'stix');
const configModel = mongoose.model('config', StixSchema, 'config');

let port = 3000;
if (process.argv.indexOf("-p") != -1) {
  port = process.argv[process.argv.indexOf("-p") + 1];
}
let repository = "repository";
if (process.argv.indexOf("-r") != -1) {
  repository = process.argv[process.argv.indexOf("-r") + 1];
}
let mongoport = 27017;
if (process.argv.indexOf("-x") != -1) {
  mongoport = process.argv[process.argv.indexOf("-x") + 1];
}
let collection = "stix";
if (process.argv.indexOf("-c") != -1) {
  collection = process.argv[process.argv.indexOf("-c") + 1];
}

/**
 * Read JSON from File Path
 *
 * @param {string} filePath Path of file for parsing
 * @returns {Object} Object parsed from File Path
 */
function readJson(filePath) {
  let json;

  if (fs.existsSync(filePath)) {
    let string = fs.readFileSync(filePath, "utf-8");
    json = JSON.parse(string);
  } else {
    console.log(`File Path [${filePath}] not found`);
  }

  return json;
}

/**
 * Process Bundles of Records
 *
 * @param {Object} bundles STIX Bundle Object
 */
function processBundlesRecords(bundles) {
  let bundlestring = JSON.stringify(bundles);
  bundles.forEach(function (bundle) {
    console.log('processing bundle id :' + bundle.id);
    let records = bundle.objects;
    if (records) {
      postRecords(records, bundlestring);
    }
  });
}

/**
 * Post Records
 *
 * @param {Array} records Array of records for sending
 * @param {string} resourcePath Relative resource path to server
 */
function postRecords(records, bundlestring) {

  console.log(`Processing Started: Records [${records.length}]`);

  let recordType = '';
  let isRelationship = false;
  let stix = null;

  records.forEach(function (record) {

    recordType = record.type || '';
    isRelationship = recordType === "relationship";
    stix = null;

    switch (recordType) {
      case "attack-pattern":
        stix = AttackPattern;
        break;
      case "course-of-action":
        stix = CourseOfAction;
        break;
      case "campaign":
        stix = Campaign;
        break;
      case "indicator":
        stix = Indicator;
        break;
      case "identity":
        stix = Identity;
        break;
      case "intrusion-set":
        stix = IntrusionSet;
        break;
      case "malware":
        stix = Malware;
        break;
      case "marking-definition":
        stix = MarkingDefinition;
        break;
      case "observed-data":
        stix = ObservedData;
        break;
      case "relationship":
        stix = Relationship;
        break;
      case "sighting":
        stix = Sighting;
        break;
      case "threat-actor":
        stix = ThreatActor;
        break;
      case "tool":
        stix = Tool;
        break;
      case "report":
        stix = Report;
        break;
      case "x-unfetter-control-assessment":
        stix = XUnfetterControlAssessment;
        break;
      case "x-unfetter-sensor":
        stix = XUnfetterSensor;
        break;
    }


    //if it's a relationship, make sure the source_ref and target_ref exist
    if (isRelationship && (bundlestring.indexOf('"id":"' + record.source_ref + '"') == -1 || bundlestring.indexOf('"id":"' + record.target_ref + '"') == -1)) {
      //no need to log it, just carry on to the next record...
      return;
    }

    record._id = record.id;

    if (stix) {

      stix.create(record, function (err, callback) {
        if (err) {
          if (err.message && err.message.includes("E11000 duplicate key error")) {
            //console.log("duplicate, just ignore.");
          }
          else {
            console.log(err);
          }
        }
        else {
          //console.log('success');
        }
      });

    }

  });

}

/**
 * Run this immediately
 *
 */
(function run() {
  console.log("Waiting to run - " + new Date().toString());
  //wait 20 seconds to run the first time
  //give the repository plenty of time to startup
  setTimeout(run2, 20000);
})();

function run2() {
  console.log("Starting processor-direct.js " + new Date().toString());

  if (process.argv.indexOf("-j") == -1) {
    console.error("The -j argument is required");
  }
  else {
    var bundles = [];
    for (var i = process.argv.indexOf("-j") + 1, len = process.argv.length; i < len; i++) {
      if (i > 1) {
        console.log('Reading file ' + process.argv[i]);
        let contents = readJson(process.argv[i]);
        bundles.push(contents);
      }
    }
    mongoose.connect(`mongodb://${repository}:${mongoport}/${collection}`);
    processBundlesRecords(bundles);
  }
}

function sharedModelProcess(bundles) {
  console.log(`Processing ${bundles.length} bundle`);
  let temp;
  let stixArr;
  bundles.forEach((bundle) => {
    temp = '';
    stixArr = bundle.objects
      .map(stix => {
        if (stix['created'] !== undefined) {
          temp = new Date(stix['created']);
          stix['created'] = temp;
        }

        if (stix['modified'] !== undefined) {
          temp = new Date(stix['modified']);
          stix['modified'] = temp;
        }
        return stix;
      })
      .map(stix => ({
        '_id': stix.id,
        'type': stix.type,
        'stix': stix
      }));

    model.create(stixArr, (err, results) => {
      if (err) {
        console.log(err);
      } else {
        // console.log('Records successfully uploaded');
        // console.log(results[0]);
      }
    });
  });
}

function processConfigurationFiles(bundles) {
  console.log(`Processing ${bundles.length} bundle`);
  configModel.create(bundles[0], (err, results) => {
    if (err) {
      console.log(err);
    } else {
      console.log('Records successfully uploaded');
      // console.log(results[0]);
    }
  });
}

async function runSharedModelUpload() {
  console.log(`Starting processor-direct.js ${new Date().toString()} (shared model)`);

  if (process.argv.indexOf('-j') === -1) {
    console.error('The -j argument is required');
  } else {
    // add bundles specified in docker-compose yaml
    let bundles = [];
    let configurationFiles = [];
    let contents;
    for (let i = process.argv.indexOf('-j') + 1, len = process.argv.length; i < len; i += 1) {
      if (i > 1) {
        console.log(`Reading stix file ${process.argv[i]}`);
        contents = readJson(process.argv[i]);
        bundles.push(contents);
      }
    }

    let kIndex = process.argv.indexOf('-k');
    if (kIndex > -1) {
      console.log(`Reading configuration file ${process.argv[kIndex + 1]}`);
      contents = readJson(process.argv[kIndex+1]);
      configurationFiles.push(contents);
    }

    console.log(`connecting to mongodb://${repository}:${mongoport}/${collection}`);
    mongoose.connect(`mongodb://${repository}:${mongoport}/${collection}`);
    sharedModelProcess(bundles);
    if (configurationFiles.length > 0) {
      console.log('Processing configuration file');
      processConfigurationFiles(configurationFiles);
    }

    // now add the bundles from mitre attack on github
    console.log('Add Mitre data?');
    console.log(addMitreData ? 'yes' : 'no');
    if (addMitreData) {
      console.log('Processing MITRE\'s Github data');
      const githubMitreUrl = 'https://api.github.com/repos/mitre/cti/contents/ATTACK';
      const stixNameList = ['attack-pattern', 'course-of-action', 'identity', 'intrusion-set', 'malware', 'marking-definition', 'relationship', 'tool'];
      for (let i = 0; i < stixNameList.length; i += 1) {
        console.log(`Processing MITRE ${stixNameList[i]} data`);
        const url = `${githubMitreUrl}/${stixNameList[i]}`;
        // get all the urls for each item in the directory
        let urls = await getStixItemUrls(url);
        if (urls.error) {
          console.log(`Error processing ${stixNameList[i]}`);
          console.log(urls.error);
        } else {
          // get the json at each url
          let stixBundles = await getStixJson(urls);
          if (stixBundles.error) {
            console.log(`Error processing json ${stixNameList[i]}`);
            console.log(stixBundles.error);
          } else {
            sharedModelProcess(stixBundles);
          }
        }
      }
      console.log('Done Processing MITRE\'s Github data');
    }
  }
}

(function runSharedModel() {
  console.log(`Waiting to run - ${new Date().toString()}`);
  // wait 20 seconds to run the first time
  // give the repository plenty of time to startup
  setTimeout(runSharedModelUpload, 20000);
}());
