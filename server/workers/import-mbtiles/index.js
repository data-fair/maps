const config = require('config')
const fs = require('fs/promises')
const events = new (require('events').EventEmitter)()
const semver = require('semver')

const asyncSqlite = require('../../utils/async-sqlite3')
const asyncMBTiles = require('../../utils/async-MBTiles')
const defaultTiles = require('./default-tiles')
const pbfTiles = require('./pbf-tiles')

const { batchSize, pool: poolSize, sleepTime, lockTime } = config.workers.importMBTiles

let stopped = false

const loop = async({ db }) => {
  // eslint-disable-next-line no-unmodified-loop-condition
  while (!stopped) {
    await db.collection('import-tilesets').updateMany({ status: 'working', lockDate: { $lt: (new Date(Date.now() - lockTime)) } }, { $set: { status: 'pending' }, $unset: { lockDate: undefined } })
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
    if (!importTask) { await new Promise(resolve => setTimeout(resolve, sleepTime)); continue }
    importTask = (await db.collection('import-tilesets').findOneAndUpdate({ _id: importTask.tast_id, status: 'pending' }, { $set: { status: 'working', lockDate: new Date() } }, { returnNewDocument: true })).value
    if (!importTask) continue

    const keeplockInterval = setInterval(() => db.collection('import-tilesets').updateOne({ _id: importTask._id, status: 'working' }, { $set: { lockDate: new Date() } }), lockTime / 2)

    try {
      let skip = importTask.tileImported || 0
      const ts = importTask.tileset
      const filename = importTask.filename
      const { method } = importTask.options

      const tileset = await db.collection('tilesets').findOne({ _id: ts })
      const v = semver.inc(tileset.version || '0.0.0', method === 'merge' ? 'minor' : 'major')

      const mbtiles = await asyncMBTiles(filename)
      const info = await mbtiles.getInfo()
      await mbtiles.close()

      let importTile = defaultTiles.importTile
      if (info.format === 'pbf') {
        importTile = pbfTiles.importTile
      }

      const sql = await asyncSqlite(filename)
      // eslint-disable-next-line no-unmodified-loop-condition
      while (!stopped) {
        const tiles = await sql.all(`SELECT * FROM tiles LIMIT ${batchSize} OFFSET ${skip}`)
        if (!tiles.length) break
        const insertedCount = (await Promise.all(tiles.map((tile) => {
          // even if tileJSON.format equals xyz, mbtiles are tms
          tile.tile_row = (1 << tile.zoom_level) - 1 - tile.tile_row
          const query = {
            ts,
            z: tile.zoom_level,
            y: tile.tile_row,
            x: tile.tile_column,
          }
          return importTile(db, query, importTask, tile)
        }))).reduce((a, b) => a + b)

        skip += tiles.length

        await db.collection('import-tilesets').updateOne({ _id: importTask._id, status: 'working' }, { $set: { tileImported: skip } })
        if (method !== 'replace') {
          await db.collection('tilesets').updateOne({ _id: ts }, {
            $inc: { tileCount: insertedCount },
            $set: { lastModified: new Date() },
          })
        }
      }
      await sql.close()
      if (stopped) await db.collection('import-tilesets').updateOne({ _id: importTask._id, status: 'working' }, { $set: { status: 'pending' }, $unset: { lockDate: undefined } })
      else {
        await fs.unlink(filename)

        const $set = { version: v, lastModified: new Date() }
        if (method === 'replace') $set.tileCount = skip
        await db.collection('tilesets').updateOne({ _id: ts }, { $set })

        if (method === 'replace') await db.collection('task').insertOne({ type: 'delete-tileset', status: 'pending', ts, version: tileset.version })

        await db.collection('import-tilesets').updateOne({ _id: importTask._id, status: 'working' }, { $set: { status: 'done', tileImported: skip }, $unset: { lockDate: undefined } })
        events.emit(`imported:${ts}`)
      }
    } catch (error) {
      console.error(error)
      await db.collection('import-tilesets').updateOne({ _id: importTask._id, status: 'working' }, { $set: { status: 'error', error }, $unset: { lockDate: undefined } })
    } finally {
      clearInterval(keeplockInterval)
    }
  }
}

const pool = []
module.exports.start = async ({ db }) => {
  for (let i = 0; i < poolSize; i++) pool.push(loop({ db }))
  return { events }
}

module.exports.stop = async () => {
  stopped = true
  await Promise.all(pool)
}
