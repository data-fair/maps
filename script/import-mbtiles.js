
(async () => {
  const mongo = await require('../server/mongodb').start()

  const filename = process.argv[2]
  const tilesetId = process.argv[3]

  await require('../server/utils/import-mbtiles')(mongo, filename, tilesetId)
  process.exit()
})()
