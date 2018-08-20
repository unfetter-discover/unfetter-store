#!/bin/bash

set -e

if [[ "$(uname -s)" == "Darwin" ]]; then
    docker-compose up -d
    docker exec -it unfetter-user-promotion python user_promotion_tool.py --port 27017 --host cti-stix-store-repository
    docker-compose down
else
    sudo docker-compose up -d
    sudo docker exec -it unfetter-user-promotion python user_promotion_tool.py --port 27017 --host cti-stix-store-repository
    sudo docker-compose down
fi
