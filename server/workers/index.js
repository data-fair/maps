
const workers = {}

module.exports.start = async ({ db }) => {
  workers.mbtilesImporter = await require('./mbtiles-importer').start({ db })

  return workers
}

module.exports.stop = async () => {
  if (workers.mbtilesImporter) await require('./mbtiles-importer').stop()
}
