const { escapePublicUrl, injectPublicUrl } = require('../../utils/style')
const { nanoid } = require('nanoid')
const maplibreStyle = require('@maplibre/maplibre-gl-style-spec')
const asyncWrap = require('../../utils/async-wrap')
const multer = require('multer')
const upload = multer().fields([{ name: 'style.json', maxCount: 1 }, { name: 'sprite.json', maxCount: 1 }, { name: 'sprite.png', maxCount: 1 }])

const router = module.exports = require('express').Router()

//

router.param('style', require('../params/style'))
// resources
require('../api-docs').paths['/styles'] = { get: {}, post: {} }
require('../api-docs').paths['/styles/{style}'] = { put: {}, delete: {} }
// files
require('../api-docs').paths['/styles/{style}.json'] = { get: {}, put: {} }
require('../api-docs').paths['/styles/{style}/sprite.json'] = { get: {} }
require('../api-docs').paths['/styles/{style}/sprite.png'] = { get: {} }

//

//

//

require('../api-docs').paths['/styles'].get = {
  tags: ['Styles'],
  parameters: [
    { $ref: '#/components/parameters/size' },
    { $ref: '#/components/parameters/skip' },
    { $ref: '#/components/parameters/page' },
    { $ref: '#/components/parameters/sort' },
  ],
  responses: {
    200: {
      description: 'List of all available styles',
      content: { 'application/json': {} },
    },
  },
}

router.get('', require('../middlewares/pagination')(), require('../middlewares/sort')(), asyncWrap(async (req, res) => {
  const query = {}
  const [styles, count] = await Promise.all([
    req.pagination.size > 0
      ? req.app.get('db').collection('styles').find(query).sort(req.sort).limit(req.pagination.size).skip(req.pagination.skip).toArray()
      : Promise.resolve([]),
    req.app.get('db').collection('styles').countDocuments(query),
  ])
  res.send({ count, results: styles.map(document => ({ _id: document._id, ...injectPublicUrl(document.style, req.publicBaseUrl) })) })
}))

//

//

require('../api-docs').paths['/styles'].post = {
  tags: ['Styles'],
  parameters: [
  ],
  requestBody: {
    content: {
      'application/json': {},
      'multipart/form-data': {
        schema: {
          type: 'object',
          required: ['style.json'],
          properties: {
            'style.json': {
              type: 'object',
            },
            'sprite.json': {
              type: 'object',
            },
            'sprite.png': {
              type: 'string',
              format: 'binary',
            },
          },
        },
        encoding: {
          'style.json': { contentType: 'application/json' },
          'sprite.json': { contentType: 'application/json' },
          'sprite.png': { contentType: 'image/png' },
        },
      },
    },
    required: true,
  },
  responses: {
    200: {
      description: 'The style has been created',
      content: { 'application/json': {} },
    },
    400: {
      description: 'Bad format',
      content: { 'application/json': {} },
    },
  },
}
router.post('', upload, asyncWrap(async (req, res) => {
  const _id = nanoid()

  if (req.headers['content-type'] === 'application/json') {
    const errors = maplibreStyle.validate(req.body)
    if (errors.length) { return res.status(400).send(errors) }
    const style = escapePublicUrl(req.body, req.publicBaseUrl)
    await req.app.get('db').collection('styles').insertOne({ _id, style })
    res.send(injectPublicUrl({ style, _id }, req.publicBaseUrl))
  } else if (req.headers['content-type'].match('multipart/form-data')) {
    const mongoDocument = { _id }
    if (!req.files['style.json']) return res.status(400).send('A style.json file should be present in the body')
    mongoDocument.style = escapePublicUrl(JSON.parse(req.files['style.json'][0].buffer.toString()), req.publicBaseUrl)
    mongoDocument.style.glyphs = 'maps://api/fonts/{fontstack}/{range}.pbf'
    const errors = maplibreStyle.validate(mongoDocument.style)
    if (errors.length) { return res.status(400).send(errors) }
    if (!!req.files['sprite.json'] !== !!req.files['sprite.png']) return res.status(400).send('sprite.json and sprite.png should always be sent together')
    if (req.files['sprite.json']) {
      mongoDocument.style.sprite = 'maps://api/styles/' + _id + '/sprite'
      mongoDocument.sprite_json = JSON.parse(req.files['sprite.json'][0].buffer.toString())
      mongoDocument.sprite_png = req.files['sprite.png'][0].buffer
    }
    await req.app.get('db').collection('styles').insertOne(mongoDocument)
    res.send(injectPublicUrl({ style: mongoDocument.style, _id }, req.publicBaseUrl))
  } else {
    res.status(400).send('Content-type ' + req.headers['content-type'] + 'not supported')
  }
}))

//

//

require('../api-docs').paths['/styles/{style}.json'].get = {
  tags: ['Styles'],
  parameters: [
    { $ref: '#/components/parameters/style' },
  ],
  responses: {
    200: {
      description: 'The corresponding style',
      content: { 'application/json': {} },
    },
    404: {
      description: 'The style does not exist',
    },
  },
}

router.get('/:style.json', asyncWrap(async (req, res) => {
  const style = injectPublicUrl(req.style.style, req.publicBaseUrl)
  res.send(style)
}))

//

//

require('../api-docs').paths['/styles/{style}.json'].put = {
  tags: ['Styles'],
  parameters: [
    { $ref: '#/components/parameters/style' },
  ],
  requestBody: {
    content: {
      'application/json': {},
    },
    required: true,
  },
  responses: {
    200: {
      description: 'The style has been updated',
      content: { 'application/json': {} },
    },
    400: {
      description: 'Bad format',
    },
    404: {
      description: 'The style does not exist',
    },
  },
}

router.put('/:style.json', asyncWrap(async (req, res) => {
  const errors = maplibreStyle.validate(req.body)
  if (errors.length) { return res.status(400).send(errors) }
  const style = escapePublicUrl(req.body, req.publicBaseUrl)
  await req.app.get('db').collection('styles').updateOne({ _id: req.params.style }, { $set: { style } })
  res.send(injectPublicUrl(style, req.publicBaseUrl))
}))

//

//

require('../api-docs').paths['/styles/{style}'].put = {
  tags: ['Styles'],
  parameters: [
    { $ref: '#/components/parameters/style' },
  ],
  requestBody: require('../api-docs').paths['/styles'].post.requestBody,
  responses: {
    200: {
      description: 'The style has been updated',
      content: { 'application/json': {} },
    },
    400: {
      description: 'Bad format',
    },
    404: {
      description: 'The style does not exist',
    },
  },
}

router.put('/:style', upload, asyncWrap(async (req, res) => {
  if (req.headers['content-type'].match('multipart/form-data')) {
    // styleZip(req, res, async (err) => {
    //   if (err) return res.status(500).send(err.message)
    //   res.send(await importZippedStyle(req.app.get('db'), req.file.buffer, req.params.style, req.body.tileset))
    // })
    const mongoDocument = { _id: req.params.style }
    if (!req.files['style.json']) return res.status(400).send('A style.json file should be present in the body')
    mongoDocument.style = escapePublicUrl(JSON.parse(req.files['style.json'][0].buffer.toString()), req.publicBaseUrl)
    mongoDocument.style.glyphs = 'maps://api/fonts/{fontstack}/{range}.pbf'
    const errors = maplibreStyle.validate(mongoDocument.style)
    if (errors.length) { return res.status(400).send(errors) }
    if (!!req.files['sprite.json'] !== !!req.files['sprite.png']) return res.status(400).send('sprite.json and sprite.png should always be sent together')
    if (req.files['sprite.json']) {
      mongoDocument.style.sprite = 'maps://api/styles/' + req.params.style + '/sprite'
      mongoDocument.sprite_json = JSON.parse(req.files['sprite.json'][0].buffer.toString())
      mongoDocument.sprite_png = req.files['sprite.png'][0].buffer
    }
    await req.app.get('db').collection('styles').replaceOne({ _id: req.params.style }, mongoDocument, { upsert: true })
    res.send(injectPublicUrl({ style: mongoDocument.style, _id: req.params.style }, req.publicBaseUrl))
  } else {
    res.status(400).send('Content-type ' + req.headers['content-type'] + 'not supported')
  }
}))

//

//

require('../api-docs').paths['/styles/{style}'].delete = {
  tags: ['Styles'],
  parameters: [
    { $ref: '#/components/parameters/style' },
  ],
  responses: {
    204: {
      description: '',
    },
    404: {
      description: 'The style does not exist',
    },
  },
}

router.delete('/:style', asyncWrap(async (req, res) => {
  await req.app.get('db').collection('styles').deleteOne({ _id: req.params.style })
  res.sendStatus(204)
}))

//

//

require('../api-docs').paths['/styles/{style}/sprite.json'].get = {
  tags: ['Styles'],
  parameters: [
    { $ref: '#/components/parameters/style' },
  ],
  responses: {
    200: {
      description: 'The sprite.json file for the specified style',
      content: { 'application/json': {} },
    },
    404: {
      description: 'The style or sprite does not exist',
    },
  },
}

router.get('/:style/sprite.json', (req, res) => {
  if (req.style.sprite_json) res.send(req.style.sprite_json)
  else res.sendStatus(404)
})

//

//

require('../api-docs').paths['/styles/{style}/sprite.png'].get = {
  tags: ['Styles'],
  parameters: [
    { $ref: '#/components/parameters/style' },
  ],
  responses: {
    200: {
      description: 'The sprite.png file for the specified style',
      content: { 'image/png': {} },
    },
    404: {
      description: 'The style or sprite does not exist',
    },
  },
}

router.get('/:style/sprite.png', (req, res) => {
  if (req.style.sprite_png) {
    res.set({ 'Content-Type': 'image/png' })
    res.send(req.style.sprite_png.buffer)
  } else res.sendStatus(404)
})
