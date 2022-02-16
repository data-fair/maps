const asyncMBTiles = require('./async-MBTiles')
const { nanoid } = require('nanoid')
const path = require('path')
const fs = require('fs/promises')
const semver = require('semver')

async function createTilesetFromMBTiles({ db }, { _id = nanoid(10), filename }, { excludeLayers = [], excludeProps = [] }) {
  const MBTiles = await asyncMBTiles(filename + '?mode=ro')
  const info = await MBTiles.getInfo()
  await MBTiles.close()
  const tileset = JSON.parse(JSON.stringify(info))
  if (tileset.vector_layers) {
    tileset.vector_layers = tileset.vector_layers.filter(vl => !excludeLayers.includes(vl.id))
    for (const vl of tileset.vector_layers) {
      for (const excludeProp of excludeProps) delete vl.fields[excludeProp]
    }
  }
  tileset.version = semver.valid(tileset.version) ? tileset.version : '0.0.0'
  tileset._id = _id
  tileset.tileCount = 0
  tileset.filesize = 0
  delete tileset.basename
  await db.collection('tilesets').insertOne(tileset)
  return tileset
}

async function importMBTiles({ db }, { tileset, filename, options }) {
  const MBTiles = await asyncMBTiles(filename + '?mode=ro')
  const info = await MBTiles.getInfo()
  await MBTiles.close()

  const existingInfo = await db.collection('tilesets').findOne({ _id: tileset })
  if (!existingInfo) throw new Error('The original tileset does not exist')
  if (existingInfo.format !== info.format) throw new Error('The new tile format does not match the original tile format')

  if (existingInfo.vector_layers) {
    const vectorLayers = [...existingInfo.vector_layers]
    for (const vl of info.vector_layers) {
      if (!options.excludeLayers.includes(vl.id) && !existingInfo.vector_layers.find(l => l.id === vl.id)) {
        vectorLayers.push(vl)
      }
    }
    for (const vl of vectorLayers) {
      for (const excludeProp of options.excludeProps) delete vl.fields[excludeProp]
    }
    info.vector_layers = vectorLayers
  }

  if (options.insertMethod === 'merge') {
    // in case of "replace" nothing to write in tileset here, it will be written after the import task

    const update = {
      $min: { minzoom: info.minzoom },
      $max: { maxzoom: info.maxzoom },
    }
    update.$set = { vector_layers: info.vector_layers }
    // TODO: calculate merged bounds ?
    if (JSON.stringify(existingInfo.bounds) !== JSON.stringify(info.bounds)) update.$unset = { bounds: undefined }
    await db.collection('tilesets').findOneAndUpdate({ _id: tileset }, update)
  }

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

module.exports = { createTilesetFromMBTiles, importMBTiles }
