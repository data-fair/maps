
const workers = {}

module.exports.start = async ({ db }) => {
  workers.importMBTiles = await require('./import-mbtiles').start({ db })
  workers.deleteTileset = await require('./delete-tileset').start({ db })
  return workers
}

module.exports.stop = async () => {
  if (workers.importMBTiles) await require('./import-mbtiles').stop()
  if (workers.deleteTileset) await require('./delete-tileset').stop()
}
