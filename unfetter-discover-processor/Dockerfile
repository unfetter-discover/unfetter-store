FROM mhart/alpine-node:7.10.1

MAINTAINER "unfetter"
LABEL Description="Node program that loads STIX data into cti-stix-store"

ENV HOST "cti-stix-store"
ENV PORT 3000
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
CMD ["node","/usr/src/app/processor.js","-p",$PORT,"-h",$HOST,"-j","mitre-attack-cis/attack-patterns.json mitre-attack-cis/course-of-actions.json mitre-attack-cis/indicators.json mitre-attack-cis/malwards.json mitre-attack-cis/marking-definition-rating.json mitre-attack-cis/relationships.json mitre-attack-cis/reports.json mitre-attack-cis/tools.json"]

