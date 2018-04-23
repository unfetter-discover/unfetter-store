FROM node:9.5-alpine

LABEL MAINTAINER="unfetter"
LABEL Description="Node program that loads STIX data into MongoDB"

ENV WORKING_DIRECTORY /usr/src/app

RUN mkdir -p $WORKING_DIRECTORY
WORKDIR $WORKING_DIRECTORY

COPY docker/set-linux-repo.sh $WORKING_DIRECTORY
COPY docker/set-npm-repo.sh $WORKING_DIRECTORY
RUN chmod 700 $WORKING_DIRECTORY/*.sh
RUN $WORKING_DIRECTORY/set-linux-repo.sh
RUN $WORKING_DIRECTORY/set-npm-repo.sh

# Install Dependencies
# COPY package-lock.json $WORKING_DIRECTORY
COPY package.json $WORKING_DIRECTORY

RUN npm --loglevel error install
RUN npm --loglevel error i -g ts-node typescript
RUN find / -name "cb-never*.tgz" -delete && \
    rm -rf /usr/share/man && \
    rm -rf /tmp/* && \
    rm -rf /var/cache/apk/*

ADD . $WORKING_DIRECTORY