const { escapePublicUrl, injectPublicUrl } = require('../../utils/style')
const { nanoid } = require('nanoid')
const router = module.exports = require('express').Router()
const maplibreStyle = require('@maplibre/maplibre-gl-style-spec')

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

router.get('', async (req, res) => {
  res.send((await req.app.get('db').collection('styles').find().toArray()).map(s => injectPublicUrl(s, req.publicBaseUrl)))
})

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

router.post('', async (req, res) => {
  const errors = maplibreStyle.validate(req.body)
  if (errors.length) { return res.status(400).send(errors) }
  const style = escapePublicUrl(req.body, req.publicBaseUrl)
  style._id = nanoid()
  await req.app.get('db').collection('styles').insertOne(style)
  res.send(injectPublicUrl(style, req.publicBaseUrl))
})

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

router.get('/:style.json', async (req, res) => {
  const style = injectPublicUrl(req.style, req.publicBaseUrl)
  res.send(style)
})

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
        content: { 'application/json': {} },
      },
      404: {
        description: 'The style does not exist',
      },
    },
}

router.put('/:style.json', async (req, res) => {
  const errors = maplibreStyle.validate(req.body)
  if (errors.length) { return res.status(400).send(errors) }

  const style = escapePublicUrl(req.body, req.publicBaseUrl)
  style._id = req.params.style
  await req.app.get('db').collection('styles').replaceOne({ _id: style._id }, style)
  res.send(injectPublicUrl(style, req.publicBaseUrl))
})

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

router.delete('/:style.json', async (req, res) => {
  await req.app.get('db').collection('styles').deleteOne({ _id: req.params.style })
  res.sendStatus(204)
})
