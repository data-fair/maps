module.exports = {
  importTile: async (db, mongoTileQuery, importTask, tile) => {
    const replaceOne = await db.collection('tiles').replaceOne(mongoTileQuery, { ...mongoTileQuery, d: tile.tile_data }, { upsert: true })
    return { new: !replaceOne.matchedCount }
  },
}
