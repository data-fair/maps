const asyncMBTiles = require('../../utils/async-MBTiles')
const fs = require('fs/promises')
const { nanoid } = require('nanoid')
const asyncWrap = require('../../utils/async-wrap')
const multer = require('multer')
const bboxUtils = require('../../utils/bbox')
const loadmbtiles = multer().single('tileset.mbtiles')
const config = require('config')
const { generateInspectStyle } = require('../../utils/style')
const { importMBTiles } = require('../../utils/import-mbtiles')

const router = module.exports = require('express').Router()

//

router.param('tileset', require('../params/tileset'))
require('../api-docs').paths['/tilesets'] = { get: {}, post: {} }
require('../api-docs').paths['/tilesets/{tileset}.json'] = { get: {} }
require('../api-docs').paths['/tilesets/{tileset}'] = { put: {}, patch: {}, delete: {} }
require('../api-docs').paths['/tilesets/{tileset}/preview/{width}x{height}.png'] = { get: {} }
require('../api-docs').paths['/tilesets/{tileset}/import-history'] = { get: {} }
router.use('/:tileset/tiles', require('./tilesets-tiles'))

//

//

//

require('../api-docs').paths['/tilesets'].get = {
  tags: ['Tilesets'],
  summary: 'List Tilesets',
  parameters: [
    { $ref: '#/components/parameters/size' },
    { $ref: '#/components/parameters/skip' },
    { $ref: '#/components/parameters/page' },
    { $ref: '#/components/parameters/sort' },
  ],
  responses: {
    200: {
      description: 'List of available TileJSONs describing tilesets',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              count: {
                type: 'number',
                description: 'Total number of tilesets',
              },
              results: {
                type: 'array',
                description: 'List of TileJSONs',
                // items: {
                //   $ref: '#/components/schemas/',
                // },
              },
            },
          },
        },
      },
    },
  },
}

router.get('', require('../middlewares/pagination')(), require('../middlewares/sort')(), asyncWrap(async (req, res) => {
  const query = {}
  if (req.query.q) query.$text = { $search: req.query.q }
  if (req.query.format) query.format = { $in: req.query.format.split(',') }
  const [tilesets, count] = await Promise.all([
    req.pagination.size > 0
      ? req.app.get('db').collection('tilesets').find(query).sort(req.sort).limit(req.pagination.size).skip(req.pagination.skip).toArray()
      : Promise.resolve([]),
    req.app.get('db').collection('tilesets').countDocuments(query),
  ])

  res.send({
    count,
    results: tilesets.map((tileset) => {
      tileset.tiles = [`${req.publicBaseUrl}/tilesets/${tileset._id}/tiles/{z}/{x}/{y}.pbf`]
      return tileset
    }),
  })
}))

//

//

require('../api-docs').paths['/tilesets'].post = {
  tags: ['Tilesets'],
  summary: 'Create a Tileset from a mbtiles',
  parameters: [],
  requestBody: {
    content: {
      'multipart/form-data': {
        schema: {
          type: 'object',
          required: ['tileset.mbtiles'],
          properties: {
            'tileset.mbtiles': {
              type: 'string',
              format: 'binary',
            },
            area: {
              description: 'Area used during merge, every geometry with the same "area" will be replaced by the new ones',
              type: 'string',
            },
          },
        },
        encoding: {
          'tileset.mbtiles': { contentType: 'application/octet-stream' },
          area: { contentType: 'text/plain' },
        },
      },
    },
    required: true,
  },
  responses: {
    200: {
      description: 'The tilejson describing the new tileset',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            description: 'https://github.com/mapbox/tilejson-spec',
            // properties: {
            // },
          },
        },
      },
    },
  },
}

router.post('', loadmbtiles, asyncWrap(async (req, res) => {
  const _id = nanoid(10)

  const filename = `./mbtiles/${_id}.mbtiles`
  await fs.writeFile(filename, req.file.buffer)

  const MBTiles = await asyncMBTiles(filename)
  const info = await MBTiles.getInfo()

  const tileset = JSON.parse(JSON.stringify(info))
  tileset._id = _id
  tileset.tileCount = 0
  delete tileset.basename
  delete tileset.filesize

  await req.app.get('db').collection('tilesets').insertOne(tileset)

  const options = {}
  if (req.body.area) options.area = req.body.area
  await importMBTiles({ db: req.app.get('db') }, {
    _id,
    tileset: _id,
    filename,
    options,
  })

  return res.send(tileset)
}))

//

//

require('../api-docs').paths['/tilesets/{tileset}.json'].get = {
  tags: ['Tilesets'],
  summary: 'Get a TileJSON',
  parameters: [
    { $ref: '#/components/parameters/tileset' },
  ],
  responses: {
    200: {
      description: 'The TileJSON of the corresponding tileset',
      content: {
        'application/json': {
          schema: {
            description: 'https://github.com/mapbox/tilejson-spec',
            type: 'object',
          },
        },
      },
    },
    404: {
      description: 'The tileset does not exist',
    },
  },
}

router.get('/:tileset.json', asyncWrap(async (req, res) => {
  const tileset = Object.assign({}, req.tilesetInfo)
  tileset.tiles = [
    `${req.publicBaseUrl}/api/tilesets/${req.params.tileset}/tiles/{z}/{x}/{y}.${tileset.format}`,
  ]
  res.send(tileset)
}))

//

//

require('../api-docs').paths['/tilesets/{tileset}'].put = {
  tags: ['Tilesets'],
  summary: 'Create a Tileset with an id from a mbtiles',
  parameters: [
    { $ref: '#/components/parameters/tileset' },
  ],
  requestBody: require('../api-docs').paths['/tilesets'].post.requestBody,
  responses: {
    200: {
      description: 'The tilejson describing the new tileset',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            description: 'https://github.com/mapbox/tilejson-spec',
            // properties: {
            // },
          },
        },
      },
    },
  },
}

router.put('/:tileset', loadmbtiles, asyncWrap(async (req, res) => {
  const _id = req.params.tileset
  const existingTileset = await req.app.get('db').collection('tilesets').findOne({ _id })
  if (existingTileset) return res.status(400).send('This tileset already exist')

  const filename = `./mbtiles/${_id}.mbtiles`
  await fs.writeFile(filename, req.file.buffer)

  const MBTiles = await asyncMBTiles(filename)
  const info = await MBTiles.getInfo()

  const tileset = JSON.parse(JSON.stringify(info))
  tileset._id = _id
  tileset.tileCount = 0
  delete tileset.basename
  delete tileset.filesize
  await req.app.get('db').collection('tilesets').insertOne(tileset)

  const options = {}
  if (req.body.area) options.area = req.body.area
  await importMBTiles({ db: req.app.get('db') }, {
    _id,
    tileset: _id,
    filename,
    options,
  })

  return res.send(tileset)
}))

//

//

require('../api-docs').paths['/tilesets/{tileset}'].patch = {
  tags: ['Tilesets'],
  summary: 'Patch a Tileset with a mbtiles diff',
  parameters: [
    { $ref: '#/components/parameters/tileset' },
  ],
  requestBody: require('../api-docs').paths['/tilesets'].post.requestBody,
  responses: {
    200: {
      description: 'The tilejson describing the updated tileset',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            description: 'https://github.com/mapbox/tilejson-spec',
            // properties: {
            // },
          },
        },
      },
    },
  },
}

router.patch('/:tileset', loadmbtiles, asyncWrap(async (req, res) => {
  const _id = nanoid()
  const filename = `./mbtiles/${_id}.mbtiles`
  await fs.writeFile(filename, req.file.buffer)
  try {
    const options = {}
    if (req.body.area) options.area = req.body.area
    await importMBTiles({ db: req.app.get('db') }, {
      _id,
      tileset: req.params.tileset,
      options,
      filename,
    })
    return res.send(req.tilesetInfo)
  } catch (error) {
    await fs.unlink(filename)
    return res.status(400).send(error.message)
  }
}))

//

//

require('../api-docs').paths['/tilesets/{tileset}'].delete = {
  tags: ['Tilesets'],
  summary: 'Delete a Tileset',
  parameters: [
    { $ref: '#/components/parameters/tileset' },
  ],
  responses: {
    204: {
      description: 'The tileset has been deleted',
      content: { 'application/json': {} },
    },
    404: {
      description: 'The tileset does not exist',
    },
  },
}

router.delete('/:tileset', asyncWrap(async (req, res) => {
  await req.app.get('db').collection('tilesets').deleteOne({ _id: req.params.tileset })
  await req.app.get('db').collection('import-tilesets').deleteMany({ tileset: req.params.tileset })
  await req.app.get('db').collection('task').insertOne({
    type: 'delete-tileset',
    tileset: req.params.tileset,
    status: 'pending',
  })
  res.sendStatus(204)
}))

require('../api-docs').paths['/tilesets/{tileset}/import-history'].get = {
  tags: ['Tilesets'],
  summary: 'Get the importation history of the tileset',
  parameters: [
    { $ref: '#/components/parameters/tileset' },
    { $ref: '#/components/parameters/size' },
    { $ref: '#/components/parameters/skip' },
    { $ref: '#/components/parameters/page' },
    { $ref: '#/components/parameters/sort' },
  ],
  responses: {
    200: {
      description: 'Importation history',
      content: {
        'application/json': {},
      },
    },
    404: {
      description: 'The tileset does not exist',
    },
  },
}

router.get('/:tileset/import-history', require('../middlewares/pagination')(), require('../middlewares/sort')(), asyncWrap(async (req, res) => {
  const query = { tileset: req.params.tileset }
  const [history, count] = await Promise.all([
    req.pagination.size > 0
      ? req.app.get('db').collection('import-tilesets').find(query).sort(req.sort).limit(req.pagination.size).skip(req.pagination.skip).toArray()
      : Promise.resolve([]),
    req.app.get('db').collection('import-tilesets').countDocuments(query),
  ])

  res.send({
    count,
    results: history,
  })
}))

//

//

require('../api-docs').paths['/tilesets/{tileset}/preview/{width}x{height}.png'].get = {
  tags: ['Tilesets'],
  summary: 'Get the preview of the tileset',
  parameters: [
    { $ref: '#/components/parameters/tileset' },
    {
      name: 'width',
      in: 'path',
      description: 'Width of the preview',
      required: true,
      schema: {
        type: 'integer',
      },
    },
    {
      name: 'height',
      in: 'path',
      description: 'Height of the preview',
      required: true,
      schema: {
        type: 'integer',
      },
    },
  ],
  responses: {
    200: {
      description: 'Image preview of the tileset',
      content: { 'image/png': {} },
    },
    404: {
      description: 'The tileset does not exist',
    },
  },
}

router.get('/:tileset/preview/:width(\\d+)x:height(\\d+).png', asyncWrap(async (req, res) => {
  const mapOptions = {
    height: parseInt(req.params.height),
    width: parseInt(req.params.width),
  }
  if (isNaN(mapOptions.height)) return res.status(400).send('Invalid image height')
  if (isNaN(mapOptions.width)) return res.status(400).send('Invalid image width')
  if (mapOptions.width * mapOptions.height > config.imageSizeLimit) return res.status(400).send('Image size over limit')

  // if (req.tilesetInfo.bboxPreview) bbox = req.tilesetInfo.bboxPreview
  // else

  if (req.tilesetInfo.center?.length === 3) {
    mapOptions.center = [req.tilesetInfo.center[0], req.tilesetInfo.center[1]]
    mapOptions.zoom = req.tilesetInfo.center[2]
  } else if (req.tilesetInfo.bounds) {
    const bbox = req.tilesetInfo.bounds
    mapOptions.center = bboxUtils.getCenter(bbox)
    mapOptions.zoom = bboxUtils.getZoom({ width: mapOptions.width, height: mapOptions.height, bbox })
  } else {
    const TileJSONs = await req.app.get('db').collection('import-tilesets').find({ tileset: req.params.tileset }).toArray()
    const bbox = bboxUtils.mergeBBoxes(TileJSONs.map(t => t.tilejson?.bounds).filter(bbox => bbox))
    mapOptions.center = bboxUtils.getCenter(bbox)
    mapOptions.zoom = bboxUtils.getZoom({ width: mapOptions.width, height: mapOptions.height, bbox })
  }

  const style = generateInspectStyle({
    sources: {
      tileset: {
        ...req.tilesetInfo,
        type: req.tilesetInfo.format === 'pbf' ? 'vector' : 'raster',
        tiles: ['maps://api/tilesets/' + req.params.tileset + '/tiles/{z}/{x}/{y}.' + req.tilesetInfo.format],
        // url: 'maps://api/tilesets/' + req.params.tileset + '.json',
      },
    },
    layers: [],
  })
  const context = {
    cookie: req.headers.cookie,
    publicBaseUrl: req.publicBaseUrl,
    cachingSize: 0,
  }
  try {
    const { buffer/*, info */ } = await req.app.get('renderer').render(style, mapOptions, { format: 'png' }, context)

    if (!buffer) return res.status(404).send('Not found')
    res.set({ 'Content-Type': 'image/png' })
    return res.status(200).send(buffer)
  } catch (error) {
    console.error(error.stack)
    return res.status(500).send(error.message)
  }
}))
