#!/bin/ash

# apk --no-cache add curl  

curl -k -H "Content-Type: application/json" -X POST https://localhost:3333/publish/notification/organization -d '{
	"data": {
		"attributes": {
			"orgId": "identity--4ac44385-691d-411a-bda8-027c61d68e99",
			"notification": {
				"type": "TESTorg",
				"heading": "TESTorg-heading",
				"body": "TESTorg-body"
			}
		}
	}
}'
