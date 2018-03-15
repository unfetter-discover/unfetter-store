FROM node:9.5-alpine

LABEL maintainer "unfetter"
LABEL Description="Create swagger documention"

# Create Application Directory
ENV WORKING_DIRECTORY /usr/share/unfetter-api-explorer
RUN mkdir -p $WORKING_DIRECTORY
WORKDIR $WORKING_DIRECTORY

COPY unfetter-api-explorer/docker/set-linux-repo.sh $WORKING_DIRECTORY
COPY unfetter-api-explorer/docker/set-npm-repo.sh $WORKING_DIRECTORY
RUN chmod 700 $WORKING_DIRECTORY/*.sh
RUN $WORKING_DIRECTORY/set-linux-repo.sh
RUN $WORKING_DIRECTORY/set-npm-repo.sh

# Copy Swagger files from Discover API
RUN mkdir -p $WORKING_DIRECTORY/../unfetter-discover-api
RUN mkdir -p $WORKING_DIRECTORY/../unfetter-discover-api/api
RUN mkdir -p $WORKING_DIRECTORY/../unfetter-discover-api/api/swagger
COPY unfetter-discover-api/multifile-remote.yaml $WORKING_DIRECTORY/../unfetter-discover-api
COPY unfetter-discover-api/api/swagger $WORKING_DIRECTORY/../unfetter-discover-api/api/swagger

# Install Dependencies
# COPY package-lock.json $WORKING_DIRECTORY
COPY unfetter-api-explorer/package.json $WORKING_DIRECTORY

RUN npm i -g http-server

# The NPM package depends on TAR package, which has a test directory with an encrypted tgz file, that gets blocked by some antivirus scanners. Removing it.
RUN npm --loglevel error install && \
    find / -name "cb-never*.tgz" -delete && \
    rm -rf /usr/share/man && \
    rm -rf /tmp/*  && \
    rm -rf /var/cache/apk/* && \
    rm -rf /usr/lib/node_modules/npm/man && \
    rm -rf /usr/lib/node_modules/npm/doc && \
    rm -rf /usr/lib/node_modules/npm/html

COPY ./unfetter-api-explorer $WORKING_DIRECTORY
