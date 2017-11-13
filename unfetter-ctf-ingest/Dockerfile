FROM node:8.5-alpine

LABEL maintainer "unfetter"
LABEL Description="Node program that loads ctf data into unfetter"

# Create Application Directory
ENV WORKING_DIRECTORY /usr/share/unfetter-ctf-ingest
RUN mkdir -p $WORKING_DIRECTORY
WORKDIR $WORKING_DIRECTORY

# Install Dependencies
COPY package-lock.json $WORKING_DIRECTORY
COPY package.json $WORKING_DIRECTORY

RUN apk update && \
    npm --loglevel error install && \
    # The NPM package depends on TAR package, which has a test directory with an encrypted tgz file, that gets blocked by some antivirus scanners. Removing it.
    find / -name "cb-never*.tgz" -delete && \
    rm -rf /usr/share/man && \
    rm -rf /tmp/*  && \
    rm -rf /var/cache/apk/* && \
    rm -rf /usr/lib/node_modules/npm/man && \
    rm -rf /usr/lib/node_modules/npm/doc && \
    rm -rf /usr/lib/node_modules/npm/html

COPY . $WORKING_DIRECTORY
