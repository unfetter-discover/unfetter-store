FROM node:10.1-alpine

LABEL MAINTAINER="unfetter"
LABEL Description="REST endpoints and Swagger documentation"

ENV WORKING_DIRECTORY /usr/share/unfetter-discover-api
# Create Application Directory
RUN mkdir -p $WORKING_DIRECTORY
WORKDIR $WORKING_DIRECTORY

COPY docker/set-linux-repo.sh $WORKING_DIRECTORY
COPY docker/set-npm-repo.sh $WORKING_DIRECTORY
RUN chmod 700 $WORKING_DIRECTORY/*.sh
RUN $WORKING_DIRECTORY/set-linux-repo.sh
RUN $WORKING_DIRECTORY/set-npm-repo.sh

# Install packages
RUN npm --loglevel error install -g multi-file-swagger && npm --loglevel error install -g pm2 && npm --loglevel error install -g json2yaml && npm --loglevel error install -g swagger && apk add --update curl

# Install Dependencies
COPY package.json $WORKING_DIRECTORY
RUN npm --loglevel error install && \
    # The NPM package depends on TAR package, which has a test directory with an encrypted tgz file, that gets blocked by some antivirus scanners. Removing it.
    find / -name "cb-never*.tgz" -delete && \
    rm -rf /usr/share/man && \
    rm -rf /tmp/*  && \
    rm -rf /var/cache/apk/* && \
    rm -rf /usr/lib/node_modules/npm/man && \
    rm -rf /usr/lib/node_modules/npm/doc && \
    rm -rf /usr/lib/node_modules/npm/html

COPY . $WORKING_DIRECTORY
RUN touch $WORKING_DIRECTORY/api/swagger/swagger.json && chmod 666 $WORKING_DIRECTORY/api/swagger/swagger.json
RUN touch $WORKING_DIRECTORY/api/swagger/swagger.yaml && chmod 666 $WORKING_DIRECTORY/api/swagger/swagger.yaml
RUN touch $WORKING_DIRECTORY/api/swagger/swagger-remote.json && chmod 666 $WORKING_DIRECTORY/api/swagger/swagger-remote.json
RUN touch $WORKING_DIRECTORY/api/swagger/swagger-remote.yaml && chmod 666 $WORKING_DIRECTORY/api/swagger/swagger-remote.yaml
RUN multi-file-swagger multifile.yaml > $WORKING_DIRECTORY/api/swagger/swagger.json
RUN multi-file-swagger multifile-remote.yaml > $WORKING_DIRECTORY/api/swagger/swagger-remote.json
RUN sleep 5
RUN json2yaml ./api/swagger/swagger.json > ./api/swagger/swagger.yaml
RUN json2yaml ./api/swagger/swagger-remote.json > ./api/swagger/swagger-remote.yaml
RUN swagger validate ./api/swagger/swagger.yaml
# Application port
EXPOSE 3000
# Open debugging ports
EXPOSE 5555
# Start Application
CMD [ "npm --loglevel error", "start" ]
