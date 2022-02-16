# Developing

## Requirement

-   Node 16
-   Docker

## Setup environment

Having all required dependencies locally is hard, this is why the recommended setup is based heavily on docker.

### Install node dependencies:

    npm i

## Run development servers

    npm run dev

Open your browser at [http://localhost:7400](http://localhost:7400)

## Run tests

    docker-compose --profile test up -d
    npm run test-docker

## Run some scripts to import data

First run the development servers then:

    docker-compose exec server ./scripts/update-openmaptiles-landcover.sh
    docker-compose exec server ./scripts/update-openmaptiles-ocean.sh
    docker-compose exec server ./scripts/update-openmaptiles-region.sh europe/france/bretagne

