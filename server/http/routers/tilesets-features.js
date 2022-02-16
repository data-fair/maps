const createError = require('http-errors')
const mercator = new (require('@mapbox/sphericalmercator'))()
const { VectorTile } = require('@mapbox/vector-tile')
const Protobuf = require('pbf')
const zlib = require('zlib')
const semver = require('semver')
const turf = require('@turf/turf')
const wkx = require('wkx')

const asyncWrap = require('../../utils/async-wrap')

const router = module.exports = require('express').Router({ mergeParams: true })

router.use(require('../params/tileset'))

require('../api-docs').paths['/tilesets/{tileset}/features'] = {
  get: {
    tags: ['Tilesets'],
    summary: 'Get features',
    description: 'Features are extracted from the tiles',
    parameters: [
      { $ref: '#/components/parameters/tileset' },
      {
        name: 'layer',
        in: 'query',
        description: 'The layer of the features',
        required: true,
        schema: {
          type: 'string',
        },
      },
      {
        name: 'intersect-wkb',
        in: 'query',
        description: 'A geometry in WKB format to use as a filter',
        required: true,
        schema: {
          type: 'string',
        },
      },
    ],
    responses: {
      200: {
        description: 'A mapped array containing property object for each point',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                count: {
                  type: 'number',
                  description: 'Total number of matching features',
                },
                results: {
                  type: 'array',
                  description: 'List of features',
                  // items: {
                  //   $ref: '#/components/schemas/',
                  // },
                },
              },
            },
          },
        },
      },
      404: {
        description: 'The tileset does not exist',
      },
    },
  },
}

// from a geometry deduce the tiles that are relevant to perform an intersection search
const geojsonTilesCoords = (geojson, minzoom, maxzoom) => {
  const bbox = turf.bbox(geojson)
  const tiles = []
  let _z = maxzoom
  do {
    const minPixelXY = mercator.px(bbox.slice(0, 2), _z)
    const maxPixelXY = mercator.px(bbox.slice(2, 4), _z)
    const minX = Math.floor(minPixelXY[0] / 256)
    const maxX = Math.floor(maxPixelXY[0] / 256)
    // inverse Y because Lng and Y are inversed
    const minY = Math.floor(maxPixelXY[1] / 256)
    const maxY = Math.floor(minPixelXY[1] / 256)
    const tileCount = (maxX - minX + 1) * (maxY - minY + 1) // TODO support area crossing lat=0 and lon=0
    if (tileCount > 4) {
      _z--
      if (_z < minzoom) throw createError(400, 'Feature too big')
    } else {
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          tiles.push({
            key: `${_z}/${x}/${y}`,
            query: {
              x,
              y,
              z: _z,
            },
          })
        }
      }
    }
  } while (tiles.length === 0)
  return tiles
}

// read all features in a tile's layer and prepare them for processing by turf
// TODO: put this in a memoize ?
// TODO: is there some turf preprocessing that can be done at this point for faster intersection, etc afterward ?
const tileFeatures = async (db, tilejson, tileCoord, layer) => {
  const query = { ...tileCoord.query, ts: tilejson._id }
  if (semver.valid(tilejson.version)) query.v = semver.major(tilejson.version)
  const tile = await db.collection('tiles').findOne(query)
  if (!tile) return []
  const vectorTile = new VectorTile(new Protobuf(zlib.gunzipSync(tile.d.buffer)))
  if (!vectorTile.layers[layer]) return []
  const features = []
  for (let i = 0; i < vectorTile.layers[layer].length; i++) {
    features.push(vectorTile.layers[layer].feature(i).toGeoJSON(tile.x, tile.y, tile.z))
  }
  return features
}

// Get filtered features from a tileset layer
router.get('/', asyncWrap(async (req, res, next) => {
  if (!req.query['intersect-wkb']) return res.status(400).send('Query parameter "intersect-wkb" is required')
  if (!req.query.layer) return res.status(400).send('Query parameter "layer" is required')

  const tilejson = req.tilesetInfo
  let intersectGeojson
  const base64urlBuffer = Buffer.from(req.query['intersect-wkb'], 'base64url')
  try {
    intersectGeojson = wkx.Geometry.parse(base64urlBuffer).toGeoJSON()
  } catch (error) {
    return res.status(400).send('Query parameter "wkb" has to be a valid wkb')
  }
  const tilesCoords = geojsonTilesCoords(intersectGeojson, tilejson.minzoom, tilejson.maxzoom)

  const features = []
  await Promise.all(tilesCoords.map(tc => tileFeatures(req.app.get('db'), tilejson, tc, req.query.layer).then(tileFeatures => {
    for (const feature of tileFeatures) features.push(feature)
  })))
  const results = []
  for (const feature of features) {
    if (turf.booleanIntersects(intersectGeojson, feature)) results.push(feature)
  }
  res.send({ results, count: features.length })
}))

// TODO: the following routes will be used to support extensions from data-fair
// they need some more thinking before settling for an API
/*
const { VectorTile, VectorTileFeature } = require('@mapbox/vector-tile')

//

require('../api-docs').paths['/tilesets/{tileset}/features/properties_bulk'] = { post: {} }
require('../api-docs').paths['/tilesets/{tileset}/features/polygon_properties_bulk'] = { post: {} }

//

//

//
const bodySchema = {
  type: 'array',
  items: {
    title: 'Point',
    description: '[Latitude,Longitude]',
    type: 'array',
    minItems: 2,
    maxItems: 2,
    items: {
      type: 'number',
    },
  },
}
require('../api-docs').paths['/tilesets/{tileset}/features/properties_bulk'].post = {
  tags: ['Tilesets'],
  summary: 'Get properties of points',
  description: 'For each given point, get the properties of the first polygon containing it',
  parameters: [
    { $ref: '#/components/parameters/tileset' },
    { $ref: '#/components/parameters/sort' },
    {
      name: 'layer',
      in: 'query',
      description: 'The layer of the features',
      required: false,
      schema: {
        type: 'string',
      },
    },
  ],
  requestBody: {
    content: {
      'application/json': {
        example: [
          [-2.4296131877192995, 47.32006795101543],
          [-2.448908857273525, 47.30914711877363],
        ],
        schema: bodySchema,
      },
    },
    required: true,
  },
  responses: {
    200: {
      description: 'A mapped array containing property object for each point',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              title: 'PointProperties',
              description: 'Object containing properties of the first feature found for that point',
              type: 'object',
            },
          },
        },
      },
    },
    404: {
      description: 'The tileset does not exist',
    },
  },
}

router.post('/properties_bulk', require('../middlewares/validate-json-body')(bodySchema), require('../middlewares/sort')(), asyncWrap(async (req, res) => {
  if (req.body.length === 0) return res.send([])
  const ts = req.params.tileset
  const tilejson = req.tilesetInfo
  const z = tilejson.maxzoom
  const points = req.body.map(point => {
      const xy = mercator.px(point, z)
      const tile = {
        x: Math.floor(xy[0] / 256),
        y: Math.floor(xy[1] / 256),
        z,
      }
      const tileKey = `${tile.z}/${tile.x}/${tile.y}`
      return {
        point,
        tile,
        tileKey,
        turfPoint: turf.point(point),
      }
    })
  const query = {
    ts,
  }
  if (semver.valid(tilejson.version)) query.v = semver.major(tilejson.version)
  const tiles = {}
  await req.app.get('db').collection('tiles').find({ ...query, $or: points.map(p => p.tile) }).toArray()
    .then(tilesArray => tilesArray.forEach(tile => { tiles[`${tile.z}/${tile.x}/${tile.y}`] = tile }))

  for (const tileKey in tiles) {
    const tile = tiles[tileKey]
    const vectorTile = new VectorTile(new Protobuf(zlib.gunzipSync(tile.d.buffer)))
    const layers = Object.keys(vectorTile.layers)
      .filter((l) => !req.query.layer || req.query.layer === l)
      .map(k => vectorTile.layers[k])
    const features = layers.reduce((a, layer) => {
      for (let i = 0; i < layer.length; i++) {
        if (VectorTileFeature.types[layer.feature(i).type] === 'Polygon') { a.push(layer.feature(i)) }
      }
      return a
    }, []).sort((a, b) => {
      for (const key in req.sort) {
        if ((a.properties[key] > b.properties[key]) === (req.sort[key] === 1)) return 1
        if ((a.properties[key] < b.properties[key]) === (req.sort[key] === 1)) return -1
      }
      return 0
    })
    let ptsLeft = points.filter(p => p.tileKey === tileKey)
    for (const feature of features) {
      const geojson = feature.toGeoJSON(tile.x, tile.y, tile.z)
      const missed = []
      for (const pt of ptsLeft) {
        if (turf.booleanPointInPolygon(pt.turfPoint, geojson)) pt.result = geojson.properties
        else missed.push(pt)
      }
      if (!missed.length) break
      ptsLeft = missed
    }
  }

  res.send(points.map(pt => pt.result))
}))

require('../api-docs').paths['/tilesets/{tileset}/features/polygon_properties_bulk'].post = {
  tags: ['Tilesets'],
  summary: 'Get properties of Geojson Feature',
  description: 'For each given Geojson Feature, get the list of properties of all features intersecting it',
  parameters: [
    { $ref: '#/components/parameters/tileset' },
    // { $ref: '#/components/parameters/sort' },
    {
      name: 'layer',
      in: 'query',
      description: 'The layer of the features',
      required: false,
      schema: {
        type: 'string',
      },
    },
  ],
  requestBody: {
    content: {
      'application/json': {
        // example: [
        //   [-2.4296131877192995, 47.32006795101543],
        //   [-2.448908857273525, 47.30914711877363],
        // ],
        schema: {
          type: 'array',
          items: {
            type: 'object',
            title: 'GeoJSONFeature',
          },
        },
      },
    },
    required: true,
  },
  responses: {
    200: {
      description: 'A mapped array containing property object for each feature',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              // title: 'Features',
              // description: 'Object containing properties of the first feature found for that point',
              type: 'array',
              items: {
                title: 'Properties',
              },
            },
          },
        },
      },
    },
    404: {
      description: 'The tileset does not exist',
    },
  },
}

router.post('/polygon_properties_bulk', require('../middlewares/validate-json-body')(bodySchema),  require('../middlewares/sort')(), asyncWrap(async (req, res) => {
  if (req.body.length === 0) return res.send([])
  const ts = req.params.tileset
  const tilejson = req.tilesetInfo
  const z = tilejson.maxzoom
  const inputs = []
  for (const geojson of req.body) {
    const tiles = geojsonTilesCoords(geojson, tilejson.minzoom, tilejson.maxzoom))
    inputs.push({
      geojson,
      tiles,
      results: [],
    })
  }
  const query = {
    ts,
  }
  if (semver.valid(tilejson.version)) query.v = semver.major(tilejson.version)
  const $or = inputs.reduce((acc, input) => {
    for (const tile of input.tiles) acc.push(tile.query)
    return acc
  }, [])
  const tiles = {}
  await req.app.get('db').collection('tiles').find({ ...query, $or }).toArray()
    .then(tilesArray => tilesArray.forEach(tile => { tiles[`${tile.z}/${tile.x}/${tile.y}`] = tile }))

  for (const tileKey in tiles) {
    const tile = tiles[tileKey]
    const vectorTile = new VectorTile(new Protobuf(zlib.gunzipSync(tile.d.buffer)))
    const layers = Object.keys(vectorTile.layers)
      .filter((l) => !req.query.layer || req.query.layer === l)
      .map(k => vectorTile.layers[k])
    const features = layers.reduce((a, layer) => {
      for (let i = 0; i < layer.length; i++) a.push(layer.feature(i))
      return a
    }, [])
    // .sort((a, b) => {
    //   for (const key in req.sort) {
    //     if ((a.properties[key] > b.properties[key]) === (req.sort[key] === 1)) return 1
    //     if ((a.properties[key] < b.properties[key]) === (req.sort[key] === 1)) return -1
    //   }
    //   return 0
    // })
    const inpts = inputs.filter(p => p.tiles.some(t => t.key === tileKey))
    for (const feature of features) {
      const geojson = feature.toGeoJSON(tile.x, tile.y, tile.z)
      for (const input of inpts) {
        if (turf.booleanIntersects(input.geojson, geojson)) input.results.push(geojson.properties)
      }
    }
  }

  res.send(inputs.map(pt => pt.results))
}))
*/
