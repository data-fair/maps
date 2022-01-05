const BSON = require('bson')

module.exports = {
  importTile: async (db, mongoTileQuery, importTask, tile) => {
    const newDocument = { ...mongoTileQuery, d: tile.tile_data }
    const existingDocument = (await db.collection('tiles').findOneAndReplace(mongoTileQuery, newDocument, { upsert: true })).value
    const existingDocumentSize = existingDocument ? BSON.calculateObjectSize(existingDocument) : 0
    return {
      new: !existingDocument,
      sizeDiff: BSON.calculateObjectSize(newDocument) - existingDocumentSize,
    }
  },
}
