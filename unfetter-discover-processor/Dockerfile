FROM node:8.5-alpine

LABEL MAINTAINER="unfetter"
LABEL Description="Node program that loads STIX data into MongoDB"

ENV WORKING_DIRECTORY /usr/src/app

RUN mkdir -p $WORKING_DIRECTORY
WORKDIR $WORKING_DIRECTORY
ADD . $WORKING_DIRECTORY

RUN apk update

RUN npm install
RUN find / -name "cb-never*.tgz" -delete && \
    rm -rf /usr/share/man && \
    rm -rf /tmp/* && \
    rm -rf /var/cache/apk/*
