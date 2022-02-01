const BSON = require('bson')

module.exports = {
  importTiles: async(db, importTask, baseQuery, tiles, timer) => { // TODO use bulkWrite
    let insertedSize = 0
    let insertedCount = 0

    await Promise.all(tiles.map(tile => {
      tile.tile_row = (1 << tile.zoom_level) - 1 - tile.tile_row
      const query = Object.assign({
        z: tile.zoom_level,
        y: tile.tile_row,
        x: tile.tile_column,
      }, baseQuery)
      const newDocument = Object.assign({ d: tile.tile_data }, query)
      return db.collection('tiles').findOneAndReplace(query, newDocument, { upsert: true }).then(({ value: existingDocument }) => {
        const existingDocumentSize = existingDocument ? BSON.calculateObjectSize(existingDocument) : 0
        if (existingDocument) insertedCount++
        insertedSize += BSON.calculateObjectSize(newDocument) - existingDocumentSize
      })
    }))
    timer.step('importTiles')

    return {
      insertedSize,
      insertedCount,
    }
  },
}
