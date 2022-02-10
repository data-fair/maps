# Developing

## Requirement

-   Node 16
-   Docker

## Setup environment

### Install maplibre-gl-native

    docker create --name maplibre-gl-native ghcr.io/koumoul-dev/docker-maplibre-gl-native:master &&\
    docker cp maplibre-gl-native:/maplibre-gl-native/lib . &&\
    docker rm maplibre-gl-native

### Install fonts

    mkdir ./fonts &&\
    wget --no-check-certificate -nv -O fonts.zip https://github.com/openmaptiles/fonts/releases/download/v2.0/v2.0.zip &&\
    unzip -q fonts.zip -d ./fonts &&\
    rm fonts.zip

### Install tilemaker

The current release of [tilemaker](https://github.com/systemed/tilemaker) (v2.0.0) does not fit our needs, while waiting for a new release we build it from a [latest commit](https://github.com/systemed/tilemaker/tree/27b3a7bc5eef1aeeed663c061c0cdcedb62099e5) :

    mkdir ./tilemaker &&\
    wget --no-check-certificate -nv -O tilemaker.zip https://github.com/systemed/tilemaker/archive/27b3a7bc5eef1aeeed663c061c0cdcedb62099e5.zip &&\
    unzip -q tilemaker.zip -d ./tilemaker &&\
    rm tilemaker.zip &&\
    mv ./tilemaker/tilemaker-27b3a7bc5eef1aeeed663c061c0cdcedb62099e5/* ./tilemaker &&\
    cd ./tilemaker &&\
    make

### Install node dependencies:

    npm i

### Pull and start service dependencies

    docker-compose up -d

## Run development servers

Run the 2 development servers with these commands in separate shells:

    npm run dev-server
    npm run dev-client

Server listening to [http://localhost:7400](http://localhost:7400)

## Run test

    npm run test
    npm run test-cover

You can also run tests from docker:

    docker build -f test.Dockerfile --tag maps-test .
    docker run --network host maps-test