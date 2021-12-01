const fontsUtils = require('../../utils/fonts')
const asyncWrap = require('../../utils/async-wrap')

const router = module.exports = require('express').Router()

//

require('../api-docs').paths['/fonts'] = { get: {} }
require('../api-docs').paths['/fonts/{fontStack}/{range}.pbf'] = { get: {} }

//

//

//

require('../api-docs').paths['/fonts'].get = {
  tags: ['Fonts'],
  parameters: [],
  responses: {
    200: {
      description: 'An array of font name',
      content: { 'application/json': {} },
    },
  },
}

router.get('', async (req, res) => {
  res.send(await fontsUtils.getFontsList())
})

//

//

require('../api-docs').paths['/fonts/{fontStack}/{range}.pbf'].get = {
  tags: ['Fonts'],
  parameters: [
    {
      name: 'fontStack',
      in: 'path',
      description: 'Comma-separated list of fonts',
      required: true,
      schema: {
        type: 'string',
      },
    },
    {
      name: 'range',
      in: 'path',
      description: 'A range of 256 Unicode code points',
      required: true,
      example: '0-255',
      schema: {
        type: 'string',
      },
    },
  ],
  responses: {
    200: {
      description: 'Requested fonts combined',
      content: { 'application/x-protobuf': {} },
    },
    404: {
      description: 'One of the requested fonts does not exist',
    },
  },
}

router.get('/:fontStack/:range(\\d+\\-\\d+).pbf', asyncWrap(async (req, res) => {
  try {
    const fonts = await fontsUtils.getFonts(req.params.fontStack, req.params.range)
    if (fonts) return res.send(fonts)
  } catch (error) {
    console.error(error)
  }
  res.status(404).send()
}))
