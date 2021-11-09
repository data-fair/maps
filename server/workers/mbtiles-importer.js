const asyncSqlite = require('../utils/async-sqlite3')
// const asyncMBTiles = require('../utils/async-MBTiles')

const fs = require('fs/promises')
const events = new (require('events').EventEmitter)()

const batchSize = 200
const timeout = process.env.NODE_ENV === 'test' ? 100 : 5000

let stopped = false

const loop = async({ db }) => {
  // eslint-disable-next-line no-unmodified-loop-condition
  while (!stopped) {
    let importTask = await db.collection('task').findOne({ type: 'import-mbtiles', status: 'pending' })
    if (!importTask) { await new Promise(resolve => setTimeout(resolve, timeout)); continue }
    importTask = (await db.collection('task').findOneAndUpdate({ _id: importTask._id, type: 'import-mbtiles', status: 'pending' }, { $set: { status: 'importing' } }, { returnNewDocument: true })).value
    if (!importTask) continue
    try {
      let skip = importTask.tileImported || 0
      const ts = importTask.tileset
      const filename = importTask.filename

      // const info = await (await asyncMBTiles(filename)).getInfo()
      const sql = await asyncSqlite(filename)
      // eslint-disable-next-line no-unmodified-loop-condition
      while (!stopped) {
        const tiles = await sql.all(`SELECT * FROM tiles LIMIT ${batchSize} OFFSET ${skip}`)
        if (!tiles.length) break
        const insertedCount = (await Promise.all(tiles.map((tile) => (async() => {
          tile.tile_row = (1 << tile.zoom_level) - 1 - tile.tile_row
          const mongotile = {
            ts,
            z: tile.zoom_level,
            y: tile.tile_row,
            x: tile.tile_column,
          }
          const replaceOne = await db.collection('tiles').replaceOne(mongotile, { ...mongotile, d: tile.tile_data }, { upsert: true })
          return 1 - replaceOne.matchedCount
        })()))).reduce((a, b) => a + b)

        skip += batchSize

        await db.collection('tilesets').updateOne({ _id: ts }, { $inc: { tileCount: insertedCount } })
      }
      if (stopped) await db.collection('task').updateOne({ _id: importTask._id, type: 'import-mbtiles', status: 'importing' }, { $set: { status: 'pending', tileImported: skip } })
      else {
        await sql.close()
        await fs.unlink(filename)
        await db.collection('task').deleteOne({ _id: importTask._id, type: 'import-mbtiles', status: 'importing' })
        events.emit(`imported:${ts}`)
      }
    } catch (error) {
      console.error(error)
      await db.collection('task').updateOne({ _id: importTask._id, type: 'import-mbtiles', status: 'importing' }, { $set: { status: 'error', error } })
    }
  }
}

const pool = []
module.exports.start = async ({ db }) => {
  for (let i = 0; i < 4; i++) pool.push(loop({ db }))
  return { events }
}

module.exports.stop = async () => {
  stopped = true
  await Promise.all(pool)
}
