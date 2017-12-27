#!/bin/ash

# apk --no-cache add curl  

curl -k -H "Content-Type: application/json" -X POST https://localhost:3333/publish/social/all -d '{
	"data": {
		"attributes": {
			"userId": "5a185c4debf9a700a43fa66a",
			"notification": {
				"type": "TEST",
				"heading": "TEST-heading",
				"body": "TEST-body"
			}
		}
	}
}'
