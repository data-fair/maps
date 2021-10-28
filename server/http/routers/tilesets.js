const tiletype = require('@mapbox/tiletype')
const fs = require('fs/promises')
const { nanoid } = require('nanoid')
const asyncWrap = require('../../utils/async-wrap')

const router = module.exports = require('express').Router()

//

router.param('tileset', require('../params/tileset'))
router.param('z', require('../params/xyz').z)
router.param('x', require('../params/xyz').x)
router.param('y', require('../params/xyz').y)
router.param('tileFormat', require('../params/tile-format'))

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
    tilesetInfo.tiles = [`${req.publicBaseUrl}/tiles/${tilesetInfo._id}/{z}/{x}/{y}.pbf`]
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
  const filename = `${_id}.mbtiles`

  await fs.writeFile(filename, req.body)
  await require('../../utils/import-mbtiles')(req.app.get('db'), filename, _id)
  await fs.unlink(filename)
  return res.sendStatus(200)
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

//

//

require('../api-docs').paths['/tilesets/{tileset}/{z}/{x}/{y}.{tileFormat}'] = {
  get: {
    tags: ['Tilesets'],
    parameters: [
      { $ref: '#/components/parameters/tileset' },
      { $ref: '#/components/parameters/z' },
      { $ref: '#/components/parameters/x' },
      { $ref: '#/components/parameters/y' },
      { $ref: '#/components/parameters/tileFormat' },
    ],
    responses: {
      200: {
        description: 'The corresponding tile',
        content: { 'application/x-protobuf': {} },
      },
      404: {
        description: 'The tileset does not exist',
      },
    },
  },
}

router.get('/:tileset/:z/:x/:y.:tileFormat', asyncWrap(async (req, res) => {
  const query = {
    ts: req.params.tileset,
    x: req.params.x,
    y: req.params.y,
    z: req.params.z,
  }

  const tile = await req.app.get('db').collection('tiles').findOne(query)
  if (!tile) { return res.sendStatus(404) }

  const headers = tiletype.headers(tile.d.buffer)
  delete headers.ETag

  res.set(headers)
  res.send(tile.d.buffer)
}))
