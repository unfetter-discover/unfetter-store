#!/bin/sh

BASEDIR=$(dirname "$0")
# npm start
curl -v -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --data @$BASEDIR/data.json http://localhost:10010/upload
