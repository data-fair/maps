module.exports = {
  version: 8,
  name: 'Koumoul Traffic',
  metadata: {
    'mapbox:type': 'template',
  },
  sources: {
    openmaptiles: {
      type: 'raster',
      tiles: [process.env.publicUrl + '/rendered-tiles/default/{z}/{x}/{y}.png'],
    },
    // adresses: {
    //   type: 'vector',
    //   tiles: [process.env.publicUrl + '/koumoul/tileserver/data/adresses/{z}/{x}/{y}.pbf'],
    //   minzoom: 15,
    //   maxzoom: 15,
    // },
    // aerialtiles: {
    //   type: 'raster',
    //   // see : https://developer.here.com/documentation/map-tile/dev_guide/topics/quick-start-map-tile.html
    //   tiles: [process.env.publicUrl + '/maptile/2.1/basetile/newest/satellite.day/{z}/{x}/{y}/256/jpg'],
    // },
  },
  // sprite: process.env.publicUrl + '/koumoul/tileserver/styles/osm-liberty/sprite',
  glyphs: process.env.publicUrl + '/fonts/{fontstack}/{range}.pbf',
  layers: [
    {
      id: 'openmaptiles',
      type: 'raster',
      source: 'openmaptiles',
      layout: {
      },
    },
  ],
}
