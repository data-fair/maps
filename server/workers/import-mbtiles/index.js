const config = require('config')
const fs = require('fs/promises')
const events = new (require('events').EventEmitter)()
const debug = require('debug')('workers:import-mbtiles')
const semver = require('semver')
const { nanoid } = require('nanoid')

const betterSQLite = require('better-sqlite3')
const asyncMBTiles = require('../../utils/async-MBTiles')
const { createTimer } = require('../../utils/timer')
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

    const timer = createTimer()

    try {
      let skip = importTask.tileImported || 0
      let importedSize = importTask.importedSize || 0
      let insertedTiles = importTask.insertedTiles || 0
      const ts = importTask.tileset
      const filename = `./local/${nanoid()}`
      const { method } = importTask.options

      const tileset = await db.collection('tilesets').findOne({ _id: ts })
      const v = semver.inc(semver.valid(tileset.version) ? tileset.version : '0.0.0', method !== 'replace' ? 'minor' : 'major')
      const major = semver.major(v)
      debug(`${skip > 0 ? 'resume' : 'start'} importation of ${ts} v${v}`)
      timer.step('readTilesetDB')

      await fs.cp(importTask.filename, filename)
      timer.step('cpMbtiles')

      const mbtiles = await asyncMBTiles(filename)

      await mbtiles.close()
      timer.step('getMBTilesInfo')

      let importTiles = defaultTiles.importTiles
      if (importTask.tilejson.format === 'pbf') {
        importTiles = pbfTiles.importTiles
      }

      const sql = betterSQLite(filename, { readonly: true })

      if (!importTask.tileCount) await db.collection('import-tilesets').updateOne({ _id: importTask._id, status: 'working' }, { $set: { tileCount: sql.prepare('SELECT COUNT(*) FROM tiles').get()['COUNT(*)'] } })
      timer.step('countTiles')
      const stmt = sql.prepare(`SELECT * FROM tiles LIMIT -1 OFFSET ${skip}`)
      const iterator = stmt.iterate()
      // eslint-disable-next-line no-unmodified-loop-condition
      while (!stopped) {
        const tiles = []
        while (tiles.length < batchSize) {
          const next = iterator.next()
          if (next.done) break
          tiles.push(next.value)
        }
        timer.step('readTilesBatch')
        if (!tiles.length) break
        const baseQuery = {
          ts,
          v: major,
        }
        const { insertedCount, insertedSize } = await importTiles(db, importTask, baseQuery, tiles, timer)

        skip += tiles.length
        insertedTiles += insertedCount
        importedSize += insertedSize

        await db.collection('import-tilesets').updateOne({ _id: importTask._id, status: 'working' }, { $set: { tileImported: skip, insertedTiles, importedSize } })
        if (method === 'merge') {
          await db.collection('tilesets').updateOne({ _id: ts }, {
            $inc: { tileCount: insertedCount, filesize: insertedSize },
            $set: { lastModified: new Date() },
          })
        }
        debug(`importation of ${ts} v${v} : ${skip} tiles processed, ${insertedCount} tile inserted, ${insertedSize / 1000}KB added`)
        timer.step('updateWorkingTileset')
        debug('timer', timer.times)
      }
      iterator.return()
      sql.close()
      if (stopped) {
        debug(`pausing importation of ${ts} v${v}`)
        await fs.unlink(filename)
        await db.collection('import-tilesets').updateOne({ _id: importTask._id, status: 'working' }, { $set: { status: 'pending' }, $unset: { lockDate: undefined } })
      } else {
        debug(`ending importation of ${ts} v${v} : ${insertedTiles} tile inserted, ${importedSize / 1000}KB added`)
        await fs.unlink(filename)
        await fs.unlink(importTask.filename)

        const $set = { version: v, lastModified: new Date() }
        if (method !== 'merge') {
          Object.assign($set, {
            tileCount: skip,
            filesize: importedSize,
            name: importTask.tilejson.name,
            description: importTask.tilejson.description,
            minzoom: importTask.tilejson.minzoom,
            maxzoom: importTask.tilejson.maxzoom,
            center: importTask.tilejson.center,
            bounds: importTask.tilejson.bounds,
            vector_layers: importTask.tilejson.vector_layers,
          })
        }
        await db.collection('tilesets').updateOne({ _id: ts }, { $set })

        // delete pervious version
        if (method === 'replace') {
          await db.collection('task').insertOne({ type: 'delete-tileset', status: 'pending', ts, version: tileset.version })
        }

        await db.collection('import-tilesets').updateOne({ _id: importTask._id, status: 'working' }, { $set: { status: 'done', tileImported: skip, importedSize, version: v }, $unset: { lockDate: undefined } })
        events.emit(`imported:${ts}`)
      }
    } catch (error) {
      console.error(error)
      await db.collection('import-tilesets').updateOne({ _id: importTask._id, status: 'working' }, { $set: { status: 'error', errorMessage: error.message }, $unset: { lockDate: undefined } })
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
