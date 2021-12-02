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
  const [tilesets, count] = await Promise.all([
    req.pagination.size > 0
      ? req.app.get('db').collection('tilesets').find(query).sort(req.sort).limit(req.pagination.size).skip(req.pagination.skip).toArray()
      : Promise.resolve([]),
    req.app.get('db').collection('tilesets').countDocuments(query),
  ])

  const lastImports = (await req.app.get('db').collection('import-tilesets').find({ _id: { $in: tilesets.map(t => t.lastImport) } }).toArray()).reduce((acc, lastImportDocument) =>
    Object.assign(acc, { [lastImportDocument.tileset]: lastImportDocument })
  , {})
  res.send({
    count,
    results: tilesets.map((tileset) => {
      tileset.tiles = [`${req.publicBaseUrl}/tilesets/${tileset._id}/tiles/{z}/{x}/{y}.pbf`]
      tileset.lastImport = lastImports[tileset._id]
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

  const tileset = JSON.parse(JSON.stringify(info))
  tileset._id = _id
  tileset.tileCount = 0
  tileset.lastImport = _id
  delete tileset.basename
  delete tileset.filesize

  const importTask = {
    _id,
    tileset: _id,
    tilejson: JSON.parse(JSON.stringify(info)),
    date: Date.now(),
    filename,
    status: 'pending',
    options: {
      area: req.body.area || 'default-area',
    },
  }

  await req.app.get('db').collection('tilesets').insertOne(tileset)
  await req.app.get('db').collection('import-tilesets').insertOne(importTask)
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
  req.tilesetInfo.tiles = [
    `${req.publicBaseUrl}/api/tilesets/${req.params.tileset}/tiles/{z}/{x}/{y}.${req.tilesetInfo.format}`,
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
  const existingTileset = await req.app.get('db').collection('tilesets').findOne({ _id })
  if (existingTileset) return res.status(400).send('This tileset already exist')

  const filename = `./mbtiles/${_id}.mbtiles`
  await fs.writeFile(filename, req.file.buffer)
  const MBTiles = await asyncMBTiles(filename)
  const info = await MBTiles.getInfo()

  const tileset = JSON.parse(JSON.stringify(info))
  tileset._id = _id
  tileset.tileCount = 0
  tileset.lastImport = _id
  delete tileset.basename
  delete tileset.filesize

  const importTask = {
    _id,
    tileset: _id,
    tilejson: JSON.parse(JSON.stringify(info)),
    filename,
    date: Date.now(),
    status: 'pending',
    options: {
      area: req.body.area || 'default-area',
    },
  }

  await req.app.get('db').collection('tilesets').insertOne(tileset)
  await req.app.get('db').collection('import-tilesets').insertOne(importTask)
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
  const lastImport = await req.app.get('db').collection('import-tilesets').findOne({ _id: req.tilesetInfo.lastImport })
  if (!['done', 'error'].includes(lastImport.status)) return res.status(400).send('An import task is already running on this tileset')

  const _id = nanoid()
  const filename = `./mbtiles/${_id}.mbtiles`
  await fs.writeFile(filename, req.file.buffer)
  const info = await (await asyncMBTiles(filename)).getInfo()
  const $set = { lastImport: _id }
  if (info.format !== req.tilesetInfo.format) res.status(400).send('The tile format does not match the original tile format')
  if (req.headersSent) return await fs.unlink(filename)

  if (info.minzoom < req.tilesetInfo.minzoom) $set.minzoom = info.minzoom
  if (info.maxzoom > req.tilesetInfo.maxzoom) $set.maxzoom = info.maxzoom

  const importTask = {
    _id,
    tileset: req.params.tileset,
    tilejson: JSON.parse(JSON.stringify(info)),
    filename,
    date: Date.now(),
    status: 'pending',
    options: {
      area: req.body.area || 'default-area',
    },
  }

  const { modifiedCount } = await req.app.get('db').collection('tilesets').updateOne({ _id: req.params.tileset, lastImport: req.tilesetInfo.lastImport }, { $set, $unset: { bounds: undefined } })
  // lastImport as been modified as we were checking everything
  if (!modifiedCount) {
    await fs.unlink(filename)
    return res.status(400).send('An import task is already running on this tileset')
  }
  await req.app.get('db').collection('import-tilesets').insertOne(importTask)
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
