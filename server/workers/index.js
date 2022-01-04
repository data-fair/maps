const config = require('config')

const workers = {}

module.exports.start = async ({ db }) => {
  if (config.workers?.importMBTiles?.enabled) workers.importMBTiles = await require('./import-mbtiles').start({ db })
  if (config.workers?.deleteTileset?.enabled) workers.deleteTileset = await require('./delete-tileset').start({ db })
  // if (config.workers?.generateMBTiles?.enabled) workers.generateMBTiles = await require('./generate-mbtiles').start({ db })
  return workers
}

module.exports.stop = async () => {
  const promises = []
  if (workers.importMBTiles) promises.push(require('./import-mbtiles').stop())
  // if (workers.generateMBTiles) await require('./generate-mbtiles').stop()
  if (workers.deleteTileset) promises.push(require('./delete-tileset').stop())
  await Promise.all(promises)
}
