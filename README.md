# Data-fair/maps

Data-fair/maps is a tile server created for [data-fair](https://github.com/data-fair/data-fair), this service is able to render maplibre/mapbox style with additionnal geometry (from base64url [wkb](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary) or POST body) using [maplibre-gl-native](https://github.com/maplibre/maplibre-gl-native).
data-fair/maps is using mongodb to store tiles to be able to load and merge mbtiles at runtime.


## Why data-fair/maps?


### What maps allow you to do?
- Update tilesets and merge tiles at runtime
- Quick server-side rendering of complex geometry
- Use [Simple-directory](https://github.com/koumoul-dev/simple-directory)
- Be more reliable (mongo storage vs file storage)


### What maps force you to do?
- Use [Simple-directory](https://github.com/koumoul-dev/simple-directory)
- Maintain a MongoDB Cluster 


### Why MongoDB ?

More flexible than files for scalable architecture (update tilesets and merge tiles at runtime) and less complicated to maintain than postgis


## Development

### Requirement

-   Node 16
-   Docker

### Setup environment

#### Install maplibre-gl-native

    docker create --name maplibre-gl-native ghcr.io/koumoul-dev/docker-maplibre-gl-native:master &&\
    docker cp maplibre-gl-native:/maplibre-gl-native/lib . &&\
    docker rm maplibre-gl-native

#### Install node dependencies:

    npm i

#### Pull and start service dependencies

    docker-compose up -d

### Run development servers
Run the 2 development servers with these commands in separate shells:

    npm run dev-server
    npm run dev-client

Server listening to [http://localhost:7400](http://localhost:7400)

### Run test

Run tests:

    npm run test
    npm run test-cover
