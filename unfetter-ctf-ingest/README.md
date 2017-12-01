# UNFETTER-CTF-STORE
Project takes custom data models (kill chain, attack pattern, etc) and generates STIX and ingests to UNFETTER DB

## Integration tests
To read a reports test file and ingest into the UNFETTER DB

	 npm run ingest:ctf -- -f test-data/ctf-sample.csv 

To read a attack patterns and kill chain file and ingest into a local UNFETTER DB

	 npm run ingest:attack-pattern -- -f test-data/attack-patterns/attack-patterns-sample.csv

To test swagger endpoints

	npm start
	./test-script/translate_data.sh
	./test-script/translate_url.sh
	./test-script/upload.sh

## Unit tests

	npm run checkup

or

	npm run clean && npm run build && npm run lint && npm run docs && npm run coverage && npm run swagger:verify

## Typedocs

	npm run docs

Browse tsdocs/index.html
