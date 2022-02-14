#!/bin/bash

set -e

if [ -z "$1" ]
  then
    echo "Write a OSM region as argument (for example europe/france/bretagne)"
fi

echo "Import the OSM region $1"

echo "Download OSM data from http://download.geofabrik.de/$1-latest.osm.pbf"

wget\
  --no-check-certificate\
  -nv\
  -O ./local/osm-data.osm.pbf\
  http://download.geofabrik.de/$1-latest.osm.pbf

echo "Use tilemaker to create vector tiles"

tilemaker/tilemaker\
  --store ./local/store\
  --threads 0\
  --input ./local/osm-data.osm.pbf\
  --output ./local/tiles.mbtiles\
  --config tilemaker/resources/config-openmaptiles.json\
  --process tilemaker/resources/process-openmaptiles.lua

echo "Register an import task on your data-fair/maps instance"

node scripts/import-mbtiles.js\
  --file ./local/tiles.mbtiles\
  --create\
  --tileset openmaptiles\
  --insert-method merge\
  --area $1