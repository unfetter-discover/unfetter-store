FROM mhart/alpine-node:7.10.1

ENV WORKING_DIRECTORY /usr/share/cti-stix-store

# Create Application Directory
RUN mkdir -p $WORKING_DIRECTORY
WORKDIR $WORKING_DIRECTORY

# Install Dependencies
COPY package.json $WORKING_DIRECTORY
RUN npm install
COPY . $WORKING_DIRECTORY

# Change permissions of the startup script - wait-for-repository.sh
RUN chmod +x $WORKING_DIRECTORY/wait-for-repository.sh

# Set Environment for Application
ENV NODE_ENV docker

# Start Application
EXPOSE 3000
CMD [ "npm", "start" ]
