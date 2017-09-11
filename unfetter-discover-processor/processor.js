const JSONAPISerializer = require('jsonapi-serializer').Serializer;

/* eslint no-console: 'off' */
const fs = require('fs');
const http = require('http');
const process = require('process');

let port = 3000;
if (process.argv.indexOf('-p') !== -1) {
  port = process.argv[process.argv.indexOf('-p') + 1];
}
let host = 'cti-stix-store';
if (process.argv.indexOf('-h') !== -1) {
  host = process.argv[process.argv.indexOf('-h') + 1];
}

const stixContentType = 'application/vnd.api+json';
const defaultOptions = {
  host,
  port,
  path: '/cti-stix-store-api',
  method: 'POST',
  headers: {
    Accept: stixContentType,
    'Content-Type': stixContentType
  }
};

/**
 * Post Records
 *
 * @param {Array} records Array of records for sending
 * @param {string} resourcePath Relative resource path to server
 */
function postRecords(records, resourcePath, bundlestring) {

  const options = Object.assign({}, defaultOptions);
  options.path = `${options.path}/${resourcePath}`;

  console.log(`Processing Started: Records [${records.length}] Type [${resourcePath}]`);
  let created = 0;
  let processed = 0;
  let failed = 0;
  const attributesList = [];

  const isRelationship = resourcePath === 'relationships';

  records.forEach((record) => {
    // if it's a relationship, make sure the source_ref and target_ref exist         
    if (isRelationship && (bundlestring.indexOf('"id":"' + record.source_ref + '"') == -1 || bundlestring.indexOf('"id":"' + record.target_ref + '"') == -1)) {
      // no need to log it, just carry on...
      return;
    }

    const has = Object.prototype.hasOwnProperty;
    for (const propertyKey in record) {
      if (has.call(record, propertyKey)) {
        attributesList.push(propertyKey);
      }
    }

    const patternSerializer = new JSONAPISerializer(resourcePath, {
      attributes: attributesList,
      keyForAttribute: 'snake_case'
    });
    const recordSerialized = patternSerializer.serialize(record);

    const request = http.request(options, (response) => {
      processed += 1;
      if (response.statusCode === 201) {
        created += 1;
      } else {
        failed += 1;
      }

      if (processed === records.length) {
        console.log(`Processing Completed: Records [${processed}] Created [${created}] Failed [${failed}] Type [${resourcePath}]`);
      }
    });

    const string = JSON.stringify(recordSerialized);
    request.write(string);

    request.end();
  });
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
    const string = fs.readFileSync(filePath, 'utf-8');
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
  const bundlestring = JSON.stringify(bundles);
  bundles.forEach((bundle) => {
    console.log(`processing bundle id : ${bundle.id}`);

    const records = bundle.objects;
    const type = bundle.x_unfetter_resource_path;
    if (records && type) {
      console.log(`Found ${records.length} ${type} records.`);
      postRecords(records, type, bundlestring);
    }

    if (bundle.custom_objects) {
      if (bundle.custom_objects.length) {
        const firstObject = bundle.custom_objects[0];
        const resourcePath = `${firstObject.type}s`;
        postRecords(bundle.custom_objects, resourcePath);
      }
    }
  });
}

function run2() {
  console.log(`Starting processor.js ${new Date().toString()}`);

  if (process.argv.indexOf('-j') === -1) {
    console.error('The -j argument is required');
  } else {
    let bundles = [];
    for (let i = process.argv.indexOf('-j') + 1, len = process.argv.length; i < len; i += 1) {
      if (i > 1) {
        console.log(`Reading file ${process.argv[i]}`);
        const contents = readJson(process.argv[i]);
        if (Array.isArray(contents)) {
          bundles = bundles.concat(contents);
        } else {
          bundles.push(contents);
        }
      }
    }
    processBundlesRecords(bundles);
  }
}

function checkUrlExists(hostCheck, portCheck, pathCheck, cb) {
  http.request({ method: 'HEAD', host: hostCheck, port: portCheck, path: pathCheck }, (r) => {
    cb(null, r.statusCode > 200 && r.statusCode < 400);
  }).on('error', cb).end();
}

function testConnectivity() {
  console.log('Testing server connnectivity');
  checkUrlExists(defaultOptions.host, defaultOptions.port, defaultOptions.path, (response) => {
    if (response && response.code === 'ECONNREFUSED') {
      const waitFor = 2;
      console.log(`Connection not ready, will try again in ${waitFor.toString()} seconds.`);
      setTimeout(testConnectivity, (waitFor * 1000));
    } else {
      run2();
    }
  });
}

/**
 * Run processes files specified as arguments
 *
 */
function run() {
  console.log(`Waiting to run - ${new Date().toString()}`);
  // wait 20 seconds to run the first time
  setTimeout(testConnectivity, 20000);
}

run();
