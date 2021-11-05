const asyncSqlite = require('../utils/async-sqlite3')
const fs = require('fs/promises')
const events = new (require('events').EventEmitter)()

const batchSize = 200
const timeout = process.env.NODE_ENV === 'test' ? 100 : 5000

let stopped = false

const loop = async({ db }) => {
  // eslint-disable-next-line no-unmodified-loop-condition
  while (!stopped) {
    let importTask = await db.collection('import-mbtiles').findOne({ status: 'pending' })
    if (!importTask) { await new Promise(resolve => setTimeout(resolve, timeout)); continue }
    importTask = (await db.collection('import-mbtiles').findOneAndUpdate({ _id: importTask._id, status: 'pending' }, { $set: { status: 'importing' } }, { returnNewDocument: true })).value
    if (!importTask) continue
    try {
      let skip = importTask.tileImported || 0
      const ts = importTask.tileset
      const filename = importTask.filename

      const sql = await asyncSqlite(filename)
      // eslint-disable-next-line no-unmodified-loop-condition
      while (!stopped) {
        const tiles = await sql.all(`SELECT * FROM tiles LIMIT ${batchSize} OFFSET ${skip}`)
        if (!tiles.length) {
          break
        }
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
      if (stopped) await db.collection('import-mbtiles').updateOne({ _id: importTask._id, status: 'importing' }, { $set: { status: 'pending', tileImported: skip } })
      else {
        await sql.close()
        await fs.unlink(filename)
        await db.collection('import-mbtiles').updateOne({ _id: importTask._id, status: 'importing' }, { $set: { status: 'done' } })
        events.emit(`imported:${ts}`)
      }
    } catch (error) {
      console.error(error)
      await db.collection('import-mbtiles').updateOne({ _id: importTask._id, status: 'importing' }, { $set: { status: 'error', error } })
    }
  }
}

const pool = []
module.exports.start = async ({ db }) => {
  for (let i = 0; i < 10; i++) pool.push(loop({ db }))
  return { events }
}

module.exports.stop = async () => {
  stopped = true
  await Promise.all(pool)
}
