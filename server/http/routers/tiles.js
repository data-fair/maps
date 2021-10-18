const tiletype = require('@mapbox/tiletype')

const router = module.exports = require('express').Router()

//

router.param('tileset', require('../params/tileset'))
router.param('z', require('../params/xyz').z)
router.param('x', require('../params/xyz').x)
router.param('y', require('../params/xyz').y)

//

//

//

require('../api-docs').paths['/tiles'] = {
  get: {
    tags: ['Tiles'],
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

router.get('', async (req, res) => {
  const tilesetInfos = await req.app.get('db').collection('tilesets').find({}).toArray()
  res.send(tilesetInfos.map((tilesetInfo) => {
    tilesetInfo.tiles = [`${req.publicBaseUrl}/tiles/${tilesetInfo._id}/{z}/{x}/{y}.pbf`]
    return tilesetInfo
  }))
})

//

//

require('../api-docs').paths['/tiles/{tileset}.json'] = {
  get: {
    tags: ['Tiles'],
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

router.get('/:tileset.json', async (req, res) => {
  req.tilesetInfo.tiles = [
    `${req.publicBaseUrl}/tiles/${req.params.tileset}/{z}/{x}/{y}.pbf`,
  ]
  res.send(req.tilesetInfo)
})

//

//

require('../api-docs').paths['/tiles/{tileset}/{z}/{x}/{y}.pbf'] = {
  get: {
    tags: ['Tiles'],
    parameters: [
      { $ref: '#/components/parameters/tileset' },
      { $ref: '#/components/parameters/z' },
      { $ref: '#/components/parameters/x' },
      { $ref: '#/components/parameters/y' },
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

router.get('/:tileset/:z/:x/:y.pbf', async (req, res) => {
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
})
