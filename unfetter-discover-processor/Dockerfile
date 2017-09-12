FROM mhart/alpine-node:7.10.1

MAINTAINER "unfetter"
LABEL Description="Node program that loads STIX data into MongoDB"

ENV MONGO_URL "repository"

ENV WORKING_DIRECTORY $PWD
ENV EXAMPLES_DIRECTORY $WORKING_DIRECTORY/examples
ENV BUNDLES_DIRECTORY $EXAMPLES_DIRECTORY/mitre-attack-cis

USER root
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY processor.js /usr/src/app
COPY package.json /usr/src/app
COPY . /usr/src/app

RUN npm install
CMD ["node","/usr/src/app/processor.js","-m", "true", "-h", $MONGO_URL]

