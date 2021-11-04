const asyncMBTiles = require('../../utils/async-MBTiles')
const fs = require('fs/promises')
const { nanoid } = require('nanoid')
const asyncWrap = require('../../utils/async-wrap')

const router = module.exports = require('express').Router()

//

router.param('tileset', require('../params/tileset'))
router.use('/:tileset/tiles', require('./tilesets-tiles'))

//

//

//

require('../api-docs').paths['/tilesets'] = {
  get: {
    tags: ['Tilesests'],
    parameters: [
    ],
    responses: {
      200: {
        description: 'List of all available TileJSONs',
        content: { 'application/json': {} },
      },
    },
  },
}

router.get('', asyncWrap(async (req, res) => {
  const tilesetInfos = await req.app.get('db').collection('tilesets').find({}).toArray()
  res.send(tilesetInfos.map((tilesetInfo) => {
    tilesetInfo.tiles = [`${req.publicBaseUrl}/tilesets/${tilesetInfo._id}/tiles/{z}/{x}/{y}.pbf`]
    return tilesetInfo
  }))
}))

//

//

require('../api-docs').paths['/tilesets'].post = {
  tags: ['Tilesets'],
  parameters: [],
  responses: {
    // 200: {
    //   description: 'List of all available TileJSONs',
    //   content: { 'application/json': {} },
    // },
  },
}

router.post('', asyncWrap(async (req, res) => {
  const _id = nanoid(10)
  const filename = `./mbtiles/${_id}.mbtiles`
  await fs.writeFile(filename, req.body)
  const MBTiles = await asyncMBTiles(filename)
  const info = await MBTiles.getInfo()
  delete info.basename
  delete info.filesize
  info._id = _id
  info.tileCount = 0
  await req.app.get('db').collection('tilesets').insertOne(info)
  await req.app.get('db').collection('import-mbtiles').insertOne({
    tileset: _id,
    filename,
    status: 'pending',
  })
  return res.send(info)
}))

//

//

require('../api-docs').paths['/tilesets/{tileset}.json'] = {
  get: {
    tags: ['Tilesets'],
    parameters: [
      { $ref: '#/components/parameters/tileset' },
    ],
    responses: {
      200: {
        description: 'The TileJSON of the corresponding tileset',
        content: { 'application/json': {} },
      },
      404: {
        description: 'The tileset does not exist',
      },
    },
  },
}

router.get('/:tileset.json', asyncWrap(async (req, res) => {
  req.tilesetInfo.tiles = [
    `${req.publicBaseUrl}/api/tiles/${req.params.tileset}/{z}/{x}/{y}.${req.tilesetInfo.format}`,
  ]
  res.send(req.tilesetInfo)
}))

//

//

require('../api-docs').paths['/tilesets/{tileset}'] = {
  delete: {
    tags: ['Tilesets'],
    parameters: [
      { $ref: '#/components/parameters/tileset' },
    ],
    responses: {
      200: {
        description: 'The TileJSON of the corresponding tileset',
        content: { 'application/json': {} },
      },
      404: {
        description: 'The tileset does not exist',
      },
    },
  },
}

router.delete('/:tileset', asyncWrap(async (req, res) => {
  await req.app.get('db').collection('tilesets').deleteOne({ _id: req.params.tileset })
  await req.app.get('db').collection('tiles').deleteMany({ ts: req.params.tileset })
  res.sendStatus(204)
}))
