
const asyncMBTiles = require('./async-MBTiles')
const sqlite = require('sqlite3')
const { promisify } = require('util')
const debug = require('debug')('mbtiles')

module.exports = async(db, filename, _id) => {
  debug('starting importation of: ' + _id)
  const MBTiles = await asyncMBTiles(filename)
  const info = await MBTiles.getInfo()

  await new Promise((resolve, reject) => {
    const sql = new sqlite.Database(filename, sqlite.OPEN_READONLY, async () => {
      const rowCount = (await promisify(sql.get.bind(sql))('SELECT COUNT(*) FROM tiles'))['COUNT(*)']
      info.tileCount = rowCount
      const all = promisify(sql.all.bind(sql))
      for (let index = 0; index < rowCount / 1000; index++) {
        // console.log(index * 1000 + ' / ' + rowCount)
        const rows = await all('SELECT * FROM tiles LIMIT 1000 OFFSET ' + index * 1000)
        await Promise.all(rows.map(row => {
          // Flip Y coordinate because MBTiles files are TMS.
          row.tile_row = (1 << row.zoom_level) - 1 - row.tile_row
          const keys = {
            ts: _id,
            z: row.zoom_level,
            y: row.tile_row,
            x: row.tile_column,
          }
          return db.collection('tiles').replaceOne(keys, { ...keys, d: row.tile_data }, { upsert: true })
        }))
      }
      resolve()
    })
  })

  await db.collection('tilesets').replaceOne({ _id }, info, { upsert: true })
  debug('ending importation of: ' + _id)
}