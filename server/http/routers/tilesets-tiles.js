const { VectorTile } = require('@mapbox/vector-tile')
const Protobuf = require('pbf')
const tiletype = require('@mapbox/tiletype')
const semver = require('semver')
const zlib = require('zlib')
const config = require('config')

const asyncWrap = require('../../utils/async-wrap')
const lastModifiedMiddleware = require('../middlewares/last-modified')

const router = module.exports = require('express').Router({ mergeParams: true })

//

router.use(require('../params/tileset'))
router.param('z', require('../params/xyz').z)
router.param('x', require('../params/xyz').x)
router.param('y', require('../params/xyz').y)

//

//

//

require('../api-docs').paths['/tilesets/{tileset}/tiles/{z}/{x}/{y}.{format}'] = {
  get: {
    tags: ['Tilesets'],
    summary: 'Get a tile',
    description: 'Get a tile from its XYZ coordinates',
    parameters: [
      { $ref: '#/components/parameters/tileset' },
      { $ref: '#/components/parameters/z' },
      { $ref: '#/components/parameters/x' },
      { $ref: '#/components/parameters/y' },
      {
        name: 'format',
        in: 'path',
        description: 'format of the tile',
        required: true,
        schema: {
          type: 'string',
          enum: ['jpg', 'pbf', 'geojson'],
        },
      },
    ],
    responses: {
      200: {
        description: 'The corresponding tile',
        content: {
          'application/x-protobuf': {},
          'application/json': {},
          'image/jpg': {},
        },
      },
      404: {
        description: 'The tileset does not exist',
      },
    },
  },
}

router.get('/:z/:x/:y.geojson', lastModifiedMiddleware((req) => req?.tilesetInfo?.lastModified), asyncWrap(async (req, res) => {
  if (req.tilesetInfo.format !== 'pbf') return res.status(400).send('Wrong format')
  const query = {
    ts: req.params.tileset,
    x: req.params.x,
    y: req.params.y,
    z: req.params.z,
  }
  if (semver.valid(req.tilesetInfo.version)) query.v = semver.major(req.tilesetInfo.version)

  const tile = await req.app.get('db').collection('tiles').findOne(query)
  if (!tile) { return res.sendStatus(204) }
  const pbf = zlib.gunzipSync(tile.d.buffer)
  const vectorTile = new VectorTile(new Protobuf(pbf))
  const geojson = {
    type: 'FeatureCollection',
    features: [],
  }
  for (const layerName in vectorTile.layers) {
    const layer = vectorTile.layers[layerName]
    for (let i = 0; i < layer.length; i++) {
      const feature = layer.feature(i)
      const featureGeoJSON = feature.toGeoJSON(req.params.x, req.params.y, req.params.z)
      featureGeoJSON.properties.layer = layerName
      geojson.features.push(featureGeoJSON)
    }
  }

  res.set({ 'Cache-Control': `public, max-age=${config?.http?.tileMaxAge || 0}` })
  res.send(geojson)
}))

router.get('/:z/:x/:y.:tileFormat', lastModifiedMiddleware((req) => req?.tilesetInfo?.lastModified), asyncWrap(async (req, res) => {
  if (req.tilesetInfo && req.params.tileFormat !== req.tilesetInfo.format) return res.status(400).send('Wrong tile format')

  const query = {
    ts: req.params.tileset,
    x: req.params.x,
    y: req.params.y,
    z: req.params.z,
  }
  if (semver.valid(req.tilesetInfo.version)) query.v = semver.major(req.tilesetInfo.version)

  const tile = await req.app.get('db').collection('tiles').findOne(query)
  if (!tile) { return res.sendStatus(204) }

  const headers = tiletype.headers(tile.d.buffer)
  delete headers.ETag

  res.set(headers)
  res.set({ 'Cache-Control': `public, max-age=${config?.http?.tileMaxAge || 0}` })
  res.send(tile.d.buffer)
}))
