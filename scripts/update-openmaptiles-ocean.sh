#!/bin/bash

set -e

echo "Download water data from https://osmdata.openstreetmap.de"

wget --no-check-certificate -nv -O ./local/water-polygons-split-4326.zip  https://osmdata.openstreetmap.de/download/water-polygons-split-4326.zip

echo "Unzip data"

unzip -q -d local ./local/water-polygons-split-4326.zip

echo "Transform shapefiles into geojson using ogr2ogr"

ogr2ogr -f GeoJSONSeq local/water_polygons.ndjson local/water-polygons-split-4326/water_polygons.shp

echo "Add ocean class to all features using ndjson-map"

cat local/water_polygons.ndjson | node node_modules/.bin/ndjson-map 'd.properties.class="ocean",d' > local/water_polygons.geojson

echo "Transform geojson into mbtiles using tippecanoe"

tippecanoe --output=local/ocean.mbtiles --force --drop-rate=0\
  --named-layer='{"file":"local/water_polygons.geojson","layer":"water"}'\
  --coalesce\
  --simplification 4\
  --exclude x\
  --exclude y

echo "Register an import task on your data-fair/maps instance"

node scripts/import-mbtiles.js\
  --file local/ocean.mbtiles
  --create
  --tileset openmaptiles
  --insert-method merge
  --area ocean