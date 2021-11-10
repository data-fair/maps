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
    const replaceOne = await db.collection('tiles').replaceOne(mongoTileQuery, { ...mongoTileQuery, d: tile.tile_data }, { upsert: true })
    return 1 - replaceOne.matchedCount
  },
}
