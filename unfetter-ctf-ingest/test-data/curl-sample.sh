#!/bin/bash
#curl -H "Content-Type: application/json" -X POST -d @csv-sample.json http://localhost:10010/upload
curl -k -H "Content-Type: application/json" -X POST -d @csv-sample.json https://localhost:443/api/ctf/parser/upload
