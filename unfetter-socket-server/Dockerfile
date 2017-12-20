FROM node:9.2-alpine

LABEL maintainer "unfetter"
LABEL Description="Socket server for unfetter"

# Create Application Directory
ENV WORKING_DIRECTORY /usr/share/unfetter-socket-server
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

# The NPM package depends on TAR package, which has a test directory with an encrypted tgz file, that gets blocked by some antivirus scanners. Removing it.
RUN npm --loglevel error install && \
    find / -name "cb-never*.tgz" -delete && \
    rm -rf /usr/share/man && \
    rm -rf /tmp/*  && \
    rm -rf /var/cache/apk/* && \
    rm -rf /usr/lib/node_modules/npm/man && \
    rm -rf /usr/lib/node_modules/npm/doc && \
    rm -rf /usr/lib/node_modules/npm/html

COPY . $WORKING_DIRECTORY

EXPOSE 3333
