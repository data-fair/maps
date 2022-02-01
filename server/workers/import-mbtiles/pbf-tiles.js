const { VectorTile } = require('@mapbox/vector-tile')
const Protobuf = require('pbf')
const vtpbf = require('vt-pbf')
const zlib = require('zlib')
const BSON = require('bson')

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

const compareFeaturesProperties = (f1, f2) => {
  f1.keys = f1.keys || Object.keys(f1.properties).filter(key => key !== 'area')
  f2.keys = f2.keys || Object.keys(f2.properties).filter(key => key !== 'area')
  if (f1.keys.length !== f2.keys.length) return false
  for (const key of f1.keys) {
    if (f1.properties[key] !== f2.properties[key]) return false
  }
  return true
}

const mergeTiles = (target, origin, area, timer) => {
  for (const layer in origin.layers) {
    if (!target.layers[layer]) {
      // debug(`Layer ${layer} does not exist yet in target tile, add it whole`)
      target.layers[layer] = origin.layers[layer]
    } else {
      // debug(`Merge features in layer ${layer}`)
      // remove previous features from same area
      target.layers[layer].features = target.layers[layer].features
        .filter(f => f.properties.area !== area)
      timer.step('filterExistingFeaturesByArea')
      // do not add matching features already present (case of overlapping tiles)
      origin.layers[layer].features = origin.layers[layer].features
        .filter(f => {
          const sameFeature = target.layers[layer].features.some(tf => {
            if (!compareFeaturesProperties(f, tf)) {
              timer.step('compareSameProperties')
              return false
            }
            timer.step('compareSameProperties')
            if (!rawGeometry(f).equals(rawGeometry(tf))) {
              timer.step('compareSameGeometry')
              return false
            }
            timer.step('compareSameGeometry')
            return true
          })
          return !sameFeature
        })
      timer.step('filterSameFeature')
      target.layers[layer].features = target.layers[layer].features.concat(origin.layers[layer].features)
      timer.step('concatFeatures')

      // sort features by area so that order is kept between iteration and the buffers are not changes unnecessarily
      target.layers[layer].features.sort((a, b) => {
        if (a.properties.area === b.properties.area) return 0
        if (a.properties.area < b.properties.area) return -1
        return 1
      })
      timer.step('sortFeatures')
    }
  }
}

module.exports = {
  importTiles: async(db, importTask, baseQuery, tiles, timer) => {
    const area = importTask?.options?.area
    for (const tile of tiles) {
      tile.tile_row = (1 << tile.zoom_level) - 1 - tile.tile_row
      tile.query = Object.assign({
        z: tile.zoom_level,
        y: tile.tile_row,
        x: tile.tile_column,
      }, baseQuery)
    }
    const existingTiles = (await db.collection('tiles').find({ $or: tiles.map(t => t.query) }).toArray())
      .reduce((acc, tile) => {
        acc[`${tile.x}/${tile.y}/${tile.z}`] = tile
        return acc
      }, {})
    timer.step('readExistingTiles')

    let insertedSize = 0
    let insertedCount = 0
    const bulkOperation = []

    for (const tile of tiles) {
      const existingDocument = existingTiles[`${tile.query.x}/${tile.query.y}/${tile.query.z}`]
      timer.step('findExistingDocument')
      let d
      if (!existingDocument) {
        insertedCount++
        if (area) d = vectorTileAsPbfBuffer(prepareVectorTile(tile.tile_data, { area }))
        else d = tile.tile_data
        timer.step('preparNewVectorTile')
      } else {
        const newTile = prepareVectorTile(tile.tile_data, area ? { area } : {})
        const oldTile = prepareVectorTile(existingDocument.d.buffer, { })
        timer.step('prepareVectorTile')
        mergeTiles(oldTile, newTile, area, timer)
        d = vectorTileAsPbfBuffer(oldTile)
        timer.step('tileAsBuffer')
      }
      const newDocument = Object.assign({ d }, tile.query)
      const existingDocumentSize = existingDocument ? BSON.calculateObjectSize(existingDocument) : 0
      insertedSize += BSON.calculateObjectSize(newDocument) - existingDocumentSize
      bulkOperation.push({
        replaceOne: {
          filter: tile.query,
          replacement: newDocument,
          upsert: true,
        },
      })
      timer.step('addBulkOperation')
    }
    await db.collection('tiles').bulkWrite(bulkOperation, { ordered: false })
    timer.step('writeBulk')
    return {
      insertedSize,
      insertedCount,
    }
  },
}
