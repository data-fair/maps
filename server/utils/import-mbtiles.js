const asyncMBTiles = require('./async-MBTiles')
const { nanoid } = require('nanoid')
const path = require('path')
const fs = require('fs/promises')

async function importMBTiles({ db }, { tileset, filename, options }) {
  const MBTiles = await asyncMBTiles(filename + '?mode=ro')
  const info = await MBTiles.getInfo()
  await MBTiles.close()

  const document = await db.collection('tilesets').findOne({ _id: tileset })
  if (!document) throw new Error('The original tileset does not exist')
  if (document.format !== info.format) throw new Error('The new tile format does not match the original tile format')

  const update = {
    $min: { minzoom: info.minzoom },
    $max: { maxzoom: info.maxzoom },
  }
  if (JSON.stringify(document.bounds) !== JSON.stringify(info.bounds)) update.$unset = { bounds: undefined }
  await db.collection('tilesets').findOneAndUpdate({ _id: tileset, format: info.format }, update, { returnNewDocument: true })
  if (path.dirname(filename) !== './mbtiles') {
    const newpath = `./mbtiles/${nanoid()}`
    await fs.cp(filename, newpath)
    filename = newpath
  }
  const importTask = {
    tileset,
    filename,
    options,
    tilejson: JSON.parse(JSON.stringify(info)),
    date: Date.now(),
    status: 'pending',
  }
  await db.collection('import-tilesets').insertOne(importTask)
}

async function createTilesetFromMBTiles({ db }, { _id = nanoid(10), filename }) {
  const MBTiles = await asyncMBTiles(filename + '?mode=ro')
  const info = await MBTiles.getInfo()
  await MBTiles.close()
  const tileset = JSON.parse(JSON.stringify(info))
  tileset._id = _id
  tileset.tileCount = 0
  tileset.filesize = 0
  delete tileset.basename
  await db.collection('tilesets').insertOne(tileset)
  return tileset
}

module.exports = { importMBTiles, createTilesetFromMBTiles }
