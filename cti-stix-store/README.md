# cti-stix-store

REST services for [Structured Threat Information Exchange 2.0](http://stixproject.github.io/stix2.0/).

The application runs on [Node.js](https://nodejs.org) and is built using the [LoopBack](https://loopback.io) framework.

The application provides web services using the [JSON API](http://jsonapi.org) specification for producing and consuming STIX Objects.

## System Requirements

* [Node.js](https://nodejs.org)
* [MongoDB](https://www.mongodb.com)

## Container Configuration

The application incorporates a [Docker](https://www.docker.com) configuration and leverages [Docker Compose](https://www.docker.com/products/docker-compose).

### Docker Compose

The Docker Compose configuration depends on MongoDB and can be started using the following command:

```bash
docker-compose up
```

The configuration provides access to REST services on port 3000.

### Docker Run

The Docker configuration can also be run using manual linking to a MongoDB container. The Docker application image can be created using the following command:

```bash
docker build -t cti-stix-store .
```

The public MongoDB container can be started using the following command:

```bash
docker run --name mongo -d mongo
```

The application can be started using Docker and linked to the MongoDB container using the following command:

```bash
docker run --name cti-stix-store --link mongo:repository -p 3000:3000 cti-stix-store
```

## Interface Specifications

The application includes a description of the services provided using the [OpenAPI](https://openapis.org) 2.0 Specification defined using [Swagger](http://swagger.io).
