const { importMBTiles, createTilesetFromMBTiles } = require('../server/utils/import-mbtiles')
const fs = require('fs/promises')
const { nanoid } = require('nanoid')

;(async () => {
  try {
    const db = await require('../server/mongodb').start()
    const filename = `./mbtiles/${nanoid()}.mbtiles`
    await fs.cp(process.argv[2], filename)
    const _id = process.argv[3]
    if (!await db.collection('tilesets').findOne({ _id })) await createTilesetFromMBTiles({ db }, { _id, filename })

    await importMBTiles({ db }, {
      filename,
      tileset: _id,
      options: {
        area: process.argv[4],
      },
    })
    await require('../server/mongodb').stop()
    process.exit()
  } catch (error) {
    console.error(error)
    process.exit(-1)
  }
})()
