# !/bin/sh

# npm start
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json'  -d '{"systemName":"sample-report-system","url":"https://reports.org/reports/latest/123"}' http://localhost:10010/translate/report/url
