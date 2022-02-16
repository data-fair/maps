const fs = require('fs/promises')
const { nanoid } = require('nanoid')
const multer = require('multer')

const asyncWrap = require('../../utils/async-wrap')
const { importMBTiles, createTilesetFromMBTiles } = require('../../utils/import-mbtiles')

const loadmbtiles = multer({ storage: multer.diskStorage({ destination: './local/' }) }).single('tileset.mbtiles')

const prepareImportOptions = (body) => {
  const options = {}
  if (body.area) options.area = body.area
  options.excludeProps = []
  if (body.excludeProp) {
    if (Array.isArray(body.excludeProp)) options.excludeProps = body.excludeProp
    else options.excludeProps = [body.excludeProp]
  }
  options.excludeLayers = []
  if (body.excludeLayer) {
    if (Array.isArray(body.excludeLayer)) options.excludeLayers = body.excludeLayer
    else options.excludeLayers = [body.excludeLayer]
  }
  return options
}

const router = module.exports = require('express').Router()

//

router.param('tileset', require('../params/tileset'))
require('../api-docs').paths['/tilesets'] = { get: {}, post: {} }
require('../api-docs').paths['/tilesets/{tileset}.json'] = { get: {}, patch: {} }
require('../api-docs').paths['/tilesets/{tileset}'] = { put: {}, patch: {}, delete: {} }
require('../api-docs').paths['/tilesets/{tileset}/import-history'] = { get: {} }
router.use('/:tileset/tiles', require('./tilesets-tiles'))
router.use('/:tileset/preview', require('./tilesets-preview'))
router.use('/:tileset/features', require('./tilesets-features'))

//

//

//

require('../api-docs').paths['/tilesets'].get = {
  tags: ['Tilesets'],
  summary: 'List Tilesets',
  description: 'Get a list of available tilesets',
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
  summary: 'Create a Tileset',
  description: 'Create a Tileset with a random id from a mbtiles',
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
            excludeProp: {
              description: 'Exclude a property from all features of the tileset',
              type: 'string',
            },
          },
        },
        encoding: {
          'tileset.mbtiles': { contentType: 'application/octet-stream' },
          area: { contentType: 'text/plain' },
          excludeProp: { contentType: 'text/plain' },
          excludeLayer: { contentType: 'text/plain' },
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

router.post('', require('../middlewares/super-admin'), loadmbtiles, asyncWrap(async (req, res) => {
  const filename = req.file.path
  try {
    const tileset = await createTilesetFromMBTiles({ db: req.app.get('db') }, { filename }, {})

    const options = prepareImportOptions(req.body)
    await importMBTiles({ db: req.app.get('db') }, {
      _id: tileset._id,
      tileset: tileset._id,
      filename,
      options,
    })

    return res.send(tileset)
  } finally {
    await fs.unlink(filename)
  }
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

require('../api-docs').paths['/tilesets/{tileset}.json'].patch = {
  tags: ['Tilesets'],
  summary: 'Patch a TileJSON',
  description: 'Patch the TileJSON of a tileset',
  parameters: [
    { $ref: '#/components/parameters/tileset' },
  ],
  requestBody: {
    content: {
      'application/json': {
        schema: require('../../../contracts/patch-tilejson'),
      },
    },
    required: true,
  },
  responses: {
    200: {
      description: 'The patched TileJSON of the corresponding tileset',
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

router.patch('/:tileset.json',
  require('../middlewares/super-admin'),
  require('../middlewares/validate-json-body')(require('../../../contracts/patch-tilejson')),
  asyncWrap(async (req, res) => {
    const tileset = await req.app.get('db').collection('tilesets').findOneAndUpdate(
      { _id: req.params.tileset },
      { $set: req.body },
      { returnNewDocument: true })

    tileset.tiles = [
      `${req.publicBaseUrl}/api/tilesets/${req.params.tileset}/tiles/{z}/{x}/{y}.${tileset.format}`,
    ]
    res.send(tileset)
  }),
)

//

//

require('../api-docs').paths['/tilesets/{tileset}'].put = {
  tags: ['Tilesets'],
  summary: 'Create a Tileset with an id',
  description: 'Create a Tileset with a given id from a mbtiles',
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

router.put('/:tileset', require('../middlewares/super-admin'), loadmbtiles, asyncWrap(async (req, res) => {
  const _id = req.params.tileset
  const existingTileset = await req.app.get('db').collection('tilesets').findOne({ _id })
  const filename = req.file.path
  try {
    if (existingTileset) {
      await fs.unlink(filename)
      return res.status(400).send('This tileset already exist')
    }

    const tileset = await createTilesetFromMBTiles({ db: req.app.get('db') }, { _id, filename }, {})

    const options = prepareImportOptions(req.body)
    await importMBTiles({ db: req.app.get('db') }, {
      _id,
      tileset: _id,
      filename,
      options,
    })

    return res.send(tileset)
  } finally {
    await fs.unlink(filename)
  }
}))

//

//

require('../api-docs').paths['/tilesets/{tileset}'].patch = {
  tags: ['Tilesets'],
  summary: 'Patch a Tileset',
  description: 'Patch a Tileset with a mbtiles',
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

router.patch('/:tileset', require('../middlewares/super-admin'), loadmbtiles, asyncWrap(async (req, res) => {
  const _id = nanoid()
  const filename = req.file.path
  try {
    const options = prepareImportOptions(req.body)
    await importMBTiles({ db: req.app.get('db') }, {
      _id,
      tileset: req.params.tileset,
      options,
      filename,
    })
    return res.send(req.tilesetInfo)
  } catch (error) {
    return res.status(400).send(error.message)
  } finally {
    await fs.unlink(filename)
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

router.delete('/:tileset', require('../middlewares/super-admin'), asyncWrap(async (req, res) => {
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
  summary: 'Get the importation history',
  description: 'Get the importation history of the tileset',
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
