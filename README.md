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

See [DEVELOPING.md](DEVELOPING.md)

## Quick start

### Start data-fair/maps
    
    # Run the dependencies
    docker-compose up -d
    # Start the server
    docker run -d --name maps -e PORT=7400 --network host ghcr.io/data-fair/maps

Server will be listening to [http://localhost:7400](http://localhost:7400). 
Authentication will not be available in this environment, a proxy is needed to redirect request to the authentication service.

### Import your tiles

    # Copy your mbtiles
    docker cp ./france.mbtiles maps:/france.mbtiles
    # Import
    docker exec maps node scripts/import-mbtiles.js --file /france.mbtiles --create --tileset france
