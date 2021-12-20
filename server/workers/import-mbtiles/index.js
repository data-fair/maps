const asyncSqlite = require('../../utils/async-sqlite3')
const asyncMBTiles = require('../../utils/async-MBTiles')

const fs = require('fs/promises')
const events = new (require('events').EventEmitter)()

const defaultTiles = require('./default-tiles')
const pbfTiles = require('./pbf-tiles')

const batchSize = 200
const timeout = process.env.NODE_ENV === 'test' ? 100 : 5000

let stopped = false

const loop = async({ db }) => {
  // eslint-disable-next-line no-unmodified-loop-condition
  while (!stopped) {
    let importTask = (await db.collection('import-tilesets').aggregate([
      { $match: { status: { $in: ['pending', 'working'] } } },
      { $sort: { date: 1 } },
      {
        $group: {
          _id: '$tileset',
          tast_id: { $first: '$_id' },
          status: { $first: '$status' },
        },
      },
      { $match: { status: 'pending' } },
      { $limit: 1 },
    ]).toArray())[0]
    if (!importTask) { await new Promise(resolve => setTimeout(resolve, timeout)); continue }
    importTask = (await db.collection('import-tilesets').findOneAndUpdate({ _id: importTask.tast_id, status: 'pending' }, { $set: { status: 'working' } }, { returnNewDocument: true })).value
    if (!importTask) continue
    try {
      let skip = importTask.tileImported || 0
      const ts = importTask.tileset
      const filename = importTask.filename

      const info = await (await asyncMBTiles(filename)).getInfo()
      let importTile = defaultTiles.importTile
      if (info.format === 'pbf') {
        importTile = pbfTiles.importTile
      }

      const sql = await asyncSqlite(filename)
      // eslint-disable-next-line no-unmodified-loop-condition
      while (!stopped) {
        const tiles = await sql.all(`SELECT * FROM tiles LIMIT ${batchSize} OFFSET ${skip}`)
        if (!tiles.length) break
        const insertedCount = (await Promise.all(tiles.map((tile) => importTile(db, importTask, tile)))).reduce((a, b) => a + b)

        skip += tiles.length

        await db.collection('tilesets').updateOne({ _id: ts }, { $inc: { tileCount: insertedCount }, $set: { lastModified: Date.now() } })
      }
      if (stopped) await db.collection('import-tilesets').updateOne({ _id: importTask._id, status: 'working' }, { $set: { status: 'pending', tileImported: skip } })
      else {
        await sql.close()
        await fs.unlink(filename)
        await db.collection('import-tilesets').updateOne({ _id: importTask._id, status: 'working' }, { $set: { status: 'done', tileImported: skip } })
        events.emit(`imported:${ts}`)
      }
    } catch (error) {
      console.error(error)
      await db.collection('import-tilesets').updateOne({ _id: importTask._id, status: 'working' }, { $set: { status: 'error', error } })
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
