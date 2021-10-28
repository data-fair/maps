const { escapePublicUrl, injectPublicUrl } = require('../../utils/style')
const { nanoid } = require('nanoid')
const importZippedStyle = require('../../utils/import-zipped-style')
const maplibreStyle = require('@maplibre/maplibre-gl-style-spec')
const asyncWrap = require('../../utils/async-wrap')
const multer = require('multer')

const router = module.exports = require('express').Router()

//

router.param('style', require('../params/style'))

//

//

//

require('../api-docs').paths['/styles'] = {
  get: {
    tags: ['Styles'],
    parameters: [
    ],
    responses: {
      200: {
        description: 'List of all available styles',
        content: { 'application/json': {} },
      },
    },
  },
}

router.get('', asyncWrap(async (req, res) => {
  res.send((await req.app.get('db').collection('styles').find().toArray()).map(s => injectPublicUrl(s.style, req.publicBaseUrl)))
}))

//

//

require('../api-docs').paths['/styles'].post = {
  tags: ['Styles'],
  parameters: [
  ],
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

const styleZip = multer().single('style.zip')
router.post('', asyncWrap(async (req, res) => {
  if (req.headers['content-type'] === 'application/json') {
    const errors = maplibreStyle.validate(req.body)
    if (errors.length) { return res.status(400).send(errors) }
    const style = escapePublicUrl(req.body, req.publicBaseUrl)
    const _id = nanoid()
    await req.app.get('db').collection('styles').insertOne({ _id, style })
    res.send(injectPublicUrl({ style, _id }, req.publicBaseUrl))
  } else if (req.headers['content-type'].match('multipart/form-data')) {
    styleZip(req, res, async (err) => {
      if (err) return res.status(500).send(err.message)
      res.send(await importZippedStyle(req.app.get('db'), req.file.buffer, nanoid(), req.body.tileset))
    })
  } else {
    res.status(400).send('Content-type ' + req.headers['content-type'] + 'not supported')
  }
}))

//

//

require('../api-docs').paths['/styles/{style}.json'] = {
  get: {
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
  await req.app.get('db').collection('styles').updateOne({ _id: req.params.style }, { style })
  res.send(injectPublicUrl(style, req.publicBaseUrl))
}))

//

//

require('../api-docs').paths['/styles/{style}.json'].delete = {
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

router.delete('/:style.json', asyncWrap(async (req, res) => {
  await req.app.get('db').collection('styles').deleteOne({ _id: req.params.style })
  res.sendStatus(204)
}))
