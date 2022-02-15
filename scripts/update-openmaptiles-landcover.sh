#!/bin/bash

set -e

echo "Download data from naturalearth"

wget --no-check-certificate -N -P ./local\
  https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/ne_10m_antarctic_ice_shelves_polys.zip
wget --no-check-certificate -N -P ./local\
  https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/ne_10m_glaciated_areas.zip
wget --no-check-certificate -N -P ./local\
  https://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/ne_10m_urban_areas.zip
unzip -q -o -d local ./local/ne_10m_antarctic_ice_shelves_polys.zip
unzip -q -o -d local ./local/ne_10m_glaciated_areas.zip
unzip -q -o -d local ./local/ne_10m_urban_areas.zip

echo "Transform shapefiles into geojson using ogr2ogr"

ogr2ogr -f GeoJSONSeq local/ne_10m_antarctic_ice_shelves_polys.ndjson local/ne_10m_antarctic_ice_shelves_polys.shp
ogr2ogr -f GeoJSONSeq local/ne_10m_glaciated_areas.ndjson local/ne_10m_glaciated_areas.shp
ogr2ogr -f GeoJSONSeq local/ne_10m_urban_areas.ndjson local/ne_10m_urban_areas.shp

echo "Add ocean classes to all features using ndjson-map"

cat local/ne_10m_antarctic_ice_shelves_polys.ndjson\
  | node node_modules/.bin/ndjson-map 'd.properties.class="ice",d.properties.subclass="glacier",d'\
  > local/ne_10m_antarctic_ice_shelves_polys.geojson
cat local/ne_10m_glaciated_areas.ndjson\
  | node node_modules/.bin/ndjson-map 'd.properties.class="ice",d.properties.subclass="glacier",d'\
  > local/ne_10m_glaciated_areas.geojson
cat local/ne_10m_urban_areas.ndjson\
  | node node_modules/.bin/ndjson-map 'd.properties.class="residential",d'\
  > local/ne_10m_urban_areas.geojson

echo "Transform geojson into mbtiles using tippecanoe"

tippecanoe --output=local/landcover.mbtiles --force --drop-rate=0\
  --named-layer='{"file":"local/ne_10m_antarctic_ice_shelves_polys.geojson","layer":"landcover"}'\
  --named-layer='{"file":"local/ne_10m_glaciated_areas.geojson","layer":"landcover"}'\
  --named-layer='{"file":"local/ne_10m_urban_areas.geojson","layer":"landuse"}'\
  --feature-filter='{"*":["any",    ["all",["<","min_zoom",1],[">=","$zoom",0]],    ["all",["<","min_zoom",2],[">=","$zoom",1]],    ["all",["<","min_zoom",3],[">=","$zoom",2]],    ["all",["<","min_zoom",4],[">=","$zoom",3]],    ["all",["<","min_zoom",5],[">=","$zoom",4]],    ["all",["<","min_zoom",6],[">=","$zoom",5]],    ["all",["<","min_zoom",7],[">=","$zoom",6]],    ["all",["<","min_zoom",8],[">=","$zoom",7]],    ["all",["<","min_zoom",9],[">=","$zoom",8]],    ["all",["<","min_zoom",10],[">=","$zoom",9]],    ["all",["<","min_zoom",11],[">=","$zoom",10]],    ["all",["<","min_zoom",12],[">=","$zoom",11]],    ["all",["<","min_zoom",13],[">=","$zoom",12]],    ["all",["<","min_zoom",14],[">=","$zoom",13]],    ["all",["<","min_zoom",15],[">=","$zoom",14]]    ]}'\
  --exclude scalerank\
  --exclude featurecla\
  --exclude area_sqkm\
  --exclude recnum\
  --exclude name\
  --coalesce\
  --simplification 4

echo "Register an import task on your data-fair/maps instance"

node scripts/import-mbtiles.js\
  --file local/landcover.mbtiles\
  --create\
  --tileset openmaptiles\
  --insert-method merge\
  --area landcover\
  --exclude-prop min_zoom