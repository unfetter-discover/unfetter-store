# !/bin/sh

BASEDIR=$(dirname "$0")
# npm start
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' --data @$BASEDIR/translate_data.json http://localhost:10010/translate/report/data
