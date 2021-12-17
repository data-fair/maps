const asyncMBTiles = require('./async-MBTiles')

async function importMBTiles({ db }, { tileset, filename, options }) {
  const MBTiles = await asyncMBTiles(filename)
  const info = await MBTiles.getInfo()

  const document = await db.collection('tilesets').findOne({ _id: tileset })
  if (!document) throw new Error('The original tileset does not exist')
  if (document.format !== info.format) throw new Error('The new tile format does not match the original tile format')

  const update = {
    $min: { minzoom: info.minzoom },
    $max: { maxzoom: info.maxzoom },
  }
  await db.collection('tilesets').findOneAndUpdate({ _id: tileset, format: info.format }, update, { returnNewDocument: true })

  const importTask = {
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
