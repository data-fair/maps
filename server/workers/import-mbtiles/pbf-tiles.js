const { VectorTile } = require('@mapbox/vector-tile')
const Protobuf = require('pbf')
const vtpbf = require('vt-pbf')
const zlib = require('zlib')

// functions from https://github.com/koumoul-dev/openmaptiles-world/blob/master/lib/mbtiles.js
const prepareVectorTile = (tileData, addProps) => {
  const tile = new VectorTile(new Protobuf(zlib.gunzipSync(tileData)))
  for (const layer in tile.layers) {
    tile.layers[layer].features = []
    for (let i = 0; i < tile.layers[layer].length; i++) {
      const feature = tile.layers[layer].feature(i)
      Object.assign(feature.properties, addProps)
      tile.layers[layer].features.push(feature)
    }
    // monkey patch tile, so that vt-pbf will read the potentially altered .features array
    tile.layers[layer].feature = (i) => tile.layers[layer].features[i]
    Object.defineProperty(tile.layers[layer], 'length', {
      get: () => tile.layers[layer].features.length,
    })
  }
  return tile
}

const vectorTileAsPbfBuffer = (tile) => {
  return zlib.gzipSync(Buffer.from(vtpbf(tile)))
}

function rawGeometry (tile) {
  const pbf = tile._pbf
  pbf.pos = tile._geometry
  return pbf.readBytes()
}

const mergeTiles = (target, origin, area) => {
  for (const layer in origin.layers) {
    if (!target.layers[layer]) {
      // debug(`Layer ${layer} does not exist yet in target tile, add it whole`)
      target.layers[layer] = origin.layers[layer]
    } else {
      // debug(`Merge features in layer ${layer}`)
      // remove previous features from same area
      target.layers[layer].features = target.layers[layer].features
        .filter(f => f.properties.area !== area)
      // do not add matching features already present (case of overlapping tiles)
      origin.layers[layer].features = origin.layers[layer].features
        .filter(f => {
          const sameFeature = target.layers[layer].features.find(tf => {
            if (JSON.stringify({ ...f.properties, area: '' }) !== JSON.stringify({ ...tf.properties, area: '' })) return false
            if (!rawGeometry(f).equals(rawGeometry(tf))) return false
            return true
          })
          return !sameFeature
        })
      target.layers[layer].features = target.layers[layer].features.concat(origin.layers[layer].features)

      // sort features by area so that order is kept between iteration and the buffers are not changes unnecessarily
      target.layers[layer].features.sort((a, b) => {
        if (a.properties.area === b.properties.area) return 0
        if (a.properties.area < b.properties.area) return -1
        return 1
      })
    }
  }
}

module.exports = {
  importTile: async (db, importTask, tile) => {
    // even if tileJSON.format equals xyz, mbtiles are tms
    tile.tile_row = (1 << tile.zoom_level) - 1 - tile.tile_row
    const mongoTileQuery = {
      ts: importTask.tileset,
      z: tile.zoom_level,
      y: tile.tile_row,
      x: tile.tile_column,
    }
    const area = importTask.area
    const existingTile = await db.collection('tiles').findOne(mongoTileQuery)
    if (!existingTile) {
      const d = vectorTileAsPbfBuffer(prepareVectorTile(tile.tile_data, { area }))
      await db.collection('tiles').insertOne({ ...mongoTileQuery, d })
      return 1
    } else {
      const newTile = prepareVectorTile(tile.tile_data, { area })
      const oldTile = prepareVectorTile(existingTile.d.buffer, { })
      const d = mergeTiles(newTile, oldTile, area)
      await db.collection('tiles').replaceOne(mongoTileQuery, { ...mongoTileQuery, d }, { upsert: true })
      return 0
    }
  },
}
