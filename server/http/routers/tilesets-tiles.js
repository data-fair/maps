const tiletype = require('@mapbox/tiletype')
const asyncWrap = require('../../utils/async-wrap')

const router = module.exports = require('express').Router({ mergeParams: true })

//

router.use(require('../params/tileset'))
router.param('z', require('../params/xyz').z)
router.param('x', require('../params/xyz').x)
router.param('y', require('../params/xyz').y)
router.param('tileFormat', require('../params/tile-format'))

//

//

//

require('../api-docs').paths['/tilesets/{tileset}/tiles/{z}/{x}/{y}.{tileFormat}'] = {
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

router.get('/:z/:x/:y.:tileFormat', asyncWrap(async (req, res) => {
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
