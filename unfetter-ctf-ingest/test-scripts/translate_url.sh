# !/bin/sh

# npm start
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json'  -d '{"type":"123","url":"http://localhost/123"}' http://localhost:10010/translate/report/url
