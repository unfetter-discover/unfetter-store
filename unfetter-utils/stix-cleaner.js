const OUTPUT_FILE_PREFIX = 'stix';
const UNFETTER_RELATIVE_PATH = '../..';
const MITRE_STIX_URL = 'https://raw.githubusercontent.com/mitre/cti/master/ATTACK/mitre-attack.json';

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

fetch(MITRE_STIX_URL)
.then(fetchRes => fetchRes.json())
.then(fetchRes => {
    console.log('Step 1: Pull in the MITRE stix data our the Unfetter stix data');
    let mitreStix = fetchRes
    let ufStix = JSON.parse(fs.readFileSync(path.join(__dirname, path.join(UNFETTER_RELATIVE_PATH, 'unfetter/config/examples/mitre-attack-cis/stix.json')), 'utf-8'));
    console.log('Step 1 Complete');
    let stixEnhancedData = JSON.parse(fs.readFileSync(path.join(__dirname, path.join(UNFETTER_RELATIVE_PATH,'unfetter/config/examples/unfetter-db/stix-enhancements.json')), 'utf-8'));

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    console.log('\nStep 2: Identify the Unfetter STIX Ids and MITRE stix ID\'s for attack patterns that describe the same attack pattern, based on the string name of the attack pattern');
    let ufAp = ufStix.objects.filter(stix => stix.type === 'attack-pattern');
    let mitreAp = mitreStix.objects.filter(stix => stix.type === 'attack-pattern');

    let apMap = [];

    function pushToApMap(ufId, mId) {
        let temp = {};
        temp.unfetterId = ufId;
        temp.mitreId = mId;
        apMap.push(temp);
    };

    let matchCount = 0;
    ufAp.forEach(ap => {
        // Find unfetter AP in mitre AP by external_id
        let matchedAp = mitreAp.find(mAp => mAp.external_references[0].external_id === ap.external_references[0].external_id);
        if (matchedAp) {
            ++matchCount;
            pushToApMap(ap.id, matchedAp.id);
        }
    });

    console.log(`Step 2 Complete\n\t# Unfetter Attack Patterms: ${ufAp.length}\n\t# Mitre Attack Patterns ${mitreAp.length}\n\t# of Matches: ${matchCount}`);

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    console.log('Step 3: Replace ALL instances of relationships that use the attack pattern ID from Unfetter to the Mitre stix ID, and update enhanced property files');
    let ufRels = ufStix.objects.filter(stix => stix.type === 'relationship');
    let mitreRels = mitreStix.objects.filter(stix => stix.type === 'relationship');
    let tempApId, newApId;

    function getMitreApId(ufApId) {
        let mapMatch = apMap.find(ap => ap.unfetterId === ufApId);
        if (mapMatch) {
            return mapMatch.mitreId;
        } else {
            return null;
        }
    }

    function updateRels(relObj, newApId, idProp) {
        relObj[idProp] = newApId;
    }


    ufRels.forEach(ufRel => {
        if (ufRel.source_ref.match(/^attack-pattern--/) !== null) {
            tempApId = ufRel.source_ref;
            newApId = getMitreApId(tempApId);
            if (newApId) {
                updateRels(ufRel, newApId, 'source_ref');
            } else {
                console.log(tempApId, ' relationship not found');
            }
        }

        if (ufRel.target_ref.match(/^attack-pattern--/) !== null) {
            tempApId = ufRel.target_ref;
            newApId = getMitreApId(tempApId);
            if (newApId) {
                updateRels(ufRel, newApId, 'target_ref');
            } else {
                console.log(tempApId, ' relationship not found');
            }
        }
    });

    apMap.forEach(apIdMap => {
        stixEnhancedData.forEach(stixEnhancement => {
            if (stixEnhancement.id === apIdMap.unfetterId) {
                stixEnhancement.id = apIdMap.mitreId;
            }
        });
    });
    console.log('Step 3 complete');

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    console.log('\nStep 4: Remove all intrusion sets, tools, malware from the Unfetter STIX data');
    let stixFilteredPhase1 = ufStix.objects.filter(stix => stix.type !== 'intrusion-set' && stix.type !== 'tool' && stix.type !== 'malware');
    console.log(`Step 4 Completed\n\t# before removal: ${ufStix.objects.length}\n\t# after removal: ${stixFilteredPhase1.length}`);

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    console.log('\nStep 5: For relationships between ONLY intrusions, tools, malware, remove those relationships');
    stixFilteredPhase2 = stixFilteredPhase1.filter(stix => stix.type !== 'relationship'
        || !(stix.source_ref.match(/intrusion-set/) !== null
            || stix.source_ref.match(/tool/) !== null
            || stix.source_ref.match(/malware/) !== null
            || stix.target_ref.match(/intrusion-set/) !== null
            || stix.target_ref.match(/tool/) !== null
            || stix.target_ref.match(/malware/) !== null)
    );
    console.log(`Step 5 Completed\n\t# before removal: ${stixFilteredPhase1.length}\n\t# after removal: ${stixFilteredPhase2.length}`);

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    console.log('\nStep 6: Remove the Unfetter attack patterns, except for the extended properties.');
    let stixFilteredPhase3 = stixFilteredPhase2.filter(stix => stix.type !== 'attack-pattern');
    ufStix.objects = stixFilteredPhase3;
    console.log(`Step 6 Completed\n\t# before removal: ${stixFilteredPhase2.length}\n\t# after removal: ${stixFilteredPhase3.length}`);

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    // Unfetter STIX file
    fs.writeFileSync(path.join(__dirname, path.join(UNFETTER_RELATIVE_PATH, `unfetter/config/examples/mitre-attack-cis/${OUTPUT_FILE_PREFIX}.json`)), JSON.stringify(ufStix, null, 2), 'utf-8');
    // Unfetter STIX enhacements file
    fs.writeFileSync(path.join(__dirname, path.join(UNFETTER_RELATIVE_PATH, `unfetter/config/examples/unfetter-db/${OUTPUT_FILE_PREFIX}-enhancements.json`)), JSON.stringify(stixEnhancedData, null, 2), 'utf-8');
    console.log('\nContents successfully written to', OUTPUT_FILE_PREFIX + '.json and', OUTPUT_FILE_PREFIX + '-enhancements.json');
})
.catch(err => console.log(err));
