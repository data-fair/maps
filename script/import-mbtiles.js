const asyncMBTiles = require('../server/utils/async-MBTiles')
const sqlite = require('sqlite3')
const { promisify } = require('util');

(async () => {
  const mongo = await require('../server/mongodb').start()

  const file = process.argv[2]
  const tilesetId = process.argv[3]

  const MBTiles = await asyncMBTiles(file)

  const info = await MBTiles.getInfo()
  await mongo.collection('tilesets').replaceOne({ _id: tilesetId }, info, { upsert: true })

  const sql = new sqlite.Database(file, sqlite.OPEN_READONLY, async () => {
    const rowCount = (await promisify(sql.get.bind(sql))('SELECT COUNT(*) FROM tiles'))['COUNT(*)']

    const all = promisify(sql.all.bind(sql))
    for (let index = 0; index < rowCount / 1000; index++) {
      console.log(index * 1000 + ' / ' + rowCount)
      const rows = await all('SELECT * FROM tiles LIMIT 1000 OFFSET ' + index * 1000)
      await Promise.all(rows.map(row => {
        // Flip Y coordinate because MBTiles files are TMS.
        row.tile_row = (1 << row.zoom_level) - 1 - row.tile_row
        const keys = {
          ts: tilesetId,
          z: row.zoom_level,
          y: row.tile_row,
          x: row.tile_column,
        }
        return mongo.collection('tiles').replaceOne(keys, { ...keys, d: row.tile_data }, { upsert: true })
      }))
    }
    console.log(rowCount + ' / ' + rowCount)
    process.exit()
  })
})()
