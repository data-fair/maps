const asyncMBTiles = require('../../utils/async-MBTiles')
const fs = require('fs/promises')
const { nanoid } = require('nanoid')
const asyncWrap = require('../../utils/async-wrap')
const multer = require('multer')
const loadmbtiles = multer().single('tileset.mbtiles')

const router = module.exports = require('express').Router()

//

router.param('tileset', require('../params/tileset'))
require('../api-docs').paths['/tilesets'] = { get: {}, post: {} }
require('../api-docs').paths['/tilesets/{tileset}.json'] = { get: {} }
require('../api-docs').paths['/tilesets/{tileset}'] = { put: {}, patch: {}, delete: {} }
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

router.get('', require('../middlewares/pagination')(), asyncWrap(async (req, res) => {
  const query = {}
  const [tilesets, count] = await Promise.all([
    req.pagination.size > 0
      ? req.app.get('db').collection('tilesets').find(query).limit(req.pagination.size).skip(req.pagination.skip).toArray()
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
  delete info.basename
  delete info.filesize
  info._id = _id
  info.tileCount = 0
  await req.app.get('db').collection('tilesets').insertOne(info)
  await req.app.get('db').collection('task').insertOne({
    type: 'import-mbtiles',
    tileset: _id,
    filename,
    status: 'pending',
  })
  return res.send(info)
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
          description: 'https://github.com/mapbox/tilejson-spec',
          type: 'object',
        },
      },
    },
    404: {
      description: 'The tileset does not exist',
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

require('../api-docs').paths['/tilesets/{tileset}'].put = {
  tags: ['Tilesets'],
  summary: 'Create a Tileset with an id from a mbtiles',
  parameters: [
    { $ref: '#/components/parameters/tileset' },
  ],
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
  const tileset = await req.app.get('db').collection('tilesets').findOne({ _id })
  if (tileset) return res.status(400).send('This tileset already exist')
  const filename = `./mbtiles/${_id}.mbtiles`
  await fs.writeFile(filename, req.file.buffer)
  const MBTiles = await asyncMBTiles(filename)
  const info = await MBTiles.getInfo()
  delete info.basename
  delete info.filesize
  info._id = _id
  info.tileCount = 0
  await req.app.get('db').collection('tilesets').insertOne(info)
  await req.app.get('db').collection('task').insertOne({
    type: 'import-mbtiles',
    tileset: _id,
    filename,
    status: 'pending',
  })
  return res.send(info)
}))

//

//

require('../api-docs').paths['/tilesets/{tileset}'].patch = {
  tags: ['Tilesets'],
  summary: 'Patch a Tileset with a mbtiles diff',
  parameters: [
    { $ref: '#/components/parameters/tileset' },
  ],
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
  const filename = `./mbtiles/${nanoid()}.mbtiles`
  await fs.writeFile(filename, req.file.buffer)
  const info = await (await asyncMBTiles(filename)).getInfo()
  const $set = {}
  if (info.format !== req.tilesetInfo.format) res.status(400).send('The tile format does not match the original tile format')
  if (req.headersSent) return await fs.unlink(filename)

  if (info.minzoom < req.tilesetInfo.minzoom) $set.minzoom = info.minzoom
  if (info.maxzoom > req.tilesetInfo.maxzoom) $set.maxzoom = info.maxzoom

  if (Object.keys($set).length) await req.app.get('db').collection('tilesets').updateOne({ _id: req.params.tileset }, { $set })

  await req.app.get('db').collection('task').insertOne({
    type: 'import-mbtiles',
    tileset: req.params.tileset,
    filename,
    status: 'pending',
  })
  return res.send(req.tilesetInfo)
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
      content: { 'application/json': {} },
    },
    404: {
      description: 'The tileset does not exist',
    },
  },
}

router.delete('/:tileset', asyncWrap(async (req, res) => {
  await req.app.get('db').collection('tilesets').deleteOne({ _id: req.params.tileset })
  await req.app.get('db').collection('task').insertOne({
    type: 'delete-tileset',
    tileset: req.params.tileset,
    status: 'pending',
  })
  res.sendStatus(204)
}))
