const asyncMBTiles = require('./async-MBTiles')

async function importMBTiles({ db }, { _id, tileset, filename, options }) {
  const MBTiles = await asyncMBTiles(filename)
  const info = await MBTiles.getInfo()
  const importTask = {
    _id,
    tileset,
    filename,
    options: Object.assign({
      area: 'default-area',
    }, options),
    tilejson: JSON.parse(JSON.stringify(info)),
    date: Date.now(),
    status: 'pending',
  }
  await db.collection('import-tilesets').insertOne(importTask)
  await MBTiles.close()
}

module.exports = { importMBTiles }
