
// const config = require('config')
const fs = require('fs/promises')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const { nanoid } = require('nanoid')
const { importMBTiles } = require('../utils/import-mbtiles')

// const events = new (require('events').EventEmitter)()
// const timeout = process.env.NODE_ENV === 'test' ? 100 : 1000
// const stopped = false

module.exports.executeGenerateTask = async (db, generateTask) => {
  const area = generateTask.area
  const tileset = generateTask.tileset
  const id = nanoid()
  await fs.mkdir(`./task-${id}`)
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    await fs.mkdir(`./task-${id}/coastline`)
    await exec(`\
      cd ./task-${id} &&
      wget --no-check-certificate -nv -O ./water-polygons-split-4326.zip  https://osmdata.openstreetmap.de/download/water-polygons-split-4326.zip &&
      unzip -q ./water-polygons-split-4326.zip &&
      mv ./water-polygons-split-4326/* ./coastline
    `)
  }

  await fs.mkdir(`./task-${id}/store`)
  await exec(`
    cd ./task-${id} &&
    wget --no-check-certificate -nv -O ./input.osm.pbf http://download.geofabrik.de/${area}-latest.osm.pbf &&
    ../tilemaker/tilemaker\
      --store ./store\
      --input ./input.osm.pbf\
      --output ../mbtiles/${id}.mbtiles\
      --config ../tilemaker/resources/config-openmaptiles.json\
      --process ../tilemaker/resources/process-openmaptiles.lua\
      --threads 0
  `)

  fs.rm(`./task-${id}`, { force: true, recursive: true })
  await importMBTiles({ db }, { tileset, filename: `./mbtiles/${id}.mbtiles`, options: { area } })
}

// const loop = async({ db }) => {
//   // eslint-disable-next-line no-unmodified-loop-condition
//   while (!stopped) {
//     let generateTask = await db.collection('task').findOne({ status: 'pending', type: 'generate-mbtiles' })
//     if (!generateTask) { await new Promise(resolve => setTimeout(resolve, timeout)); continue }
//     generateTask = (await db.collection('task').findOneAndUpdate({ _id: generateTask._id, status: 'pending', type: 'generate-mbtiles' }, { $set: { status: 'working' } }, { returnNewDocument: true })).value
//     if (!generateTask) return
//       try {
//       await module.exports.executeGenerateTask(db, generateTask)
//       await db.collection('task').updateOne({ _id: generateTask._id, status: 'working' }, { $set: { status: 'done' } })
//     } catch (error) {
//       console.error(error)
//       await db.collection('task').updateOne({ _id: generateTask._id, status: 'working' }, { $set: { status: 'error', error } })
//     }
//   }
// }

// const pool = []
// module.exports.start = async ({ db }) => {
//   for (let i = 0; i < 2; i++) pool.push(loop({ db }))
//   return { events }
// }

// module.exports.stop = async () => {
//   stopped = true
//   await Promise.all(pool)
// }
