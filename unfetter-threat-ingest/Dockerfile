FROM node:10.1-alpine

ARG https_proxy_url

LABEL MAINTAINER="unfetter"
LABEL Description="Node program that loads threat feed data into MongoDB"

# Create Application Directory
ENV WORKING_DIRECTORY /usr/src/unfetter-threat-ingest
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

RUN if [ "x$https_proxy_url" = "x" ] ; then echo No proxy applied ; else npm config --global set proxy $https_proxy_url ; fi
RUN if [ "x$https_proxy_url" = "x" ] ; then echo No https_proxy applied ; else npm config --global set https_proxy $https_proxy_url ; fi

RUN npm --loglevel error i -g ts-node@6.0.0 typescript@2.8.3
RUN npm --loglevel error install

# Remove unneeded dependencies that scan as high risk
RUN find / -name "cb-never*.tgz" -delete && \
    rm -rf /usr/share/man && \
    rm -rf /tmp/* && \
    rm -rf /var/cache/apk/*

COPY . $WORKING_DIRECTORY

EXPOSE 5010
