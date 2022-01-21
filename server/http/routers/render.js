
const bboxUtils = require('../../utils/bbox')
const wkx = require('wkx')
const asyncWrap = require('../../utils/async-wrap')
const config = require('config')

const router = module.exports = require('express').Router()

//

router.param('style', require('../params/style'))

//

//

//

require('../api-docs').paths['/render/{style}/{width}x{height}.{format}'] = {
  get: {
    tags: ['Render'],
    parameters: [
      { $ref: '#/components/parameters/style' },
      {
        name: 'width',
        in: 'path',
        description: 'Width of the requested image',
        required: true,
        schema: {
          type: 'integer',
        },
      },
      {
        name: 'height',
        in: 'path',
        description: 'Height of the requested image',
        required: true,
        schema: {
          type: 'integer',
        },
      },
      {
        name: 'format',
        in: 'path',
        description: 'Format of the requested image',
        required: true,

        schema: {
          type: 'string',
          // oneOf: ['png', 'jpg', 'jpeg'],
        },
      },
      //
      {
        name: 'zoom',
        in: 'query',
        description: 'Zoom level, optional, required while using "lon" and "lat" parameters, incompatible with "padding"',
        required: false,
        schema: {
          type: 'number',
        },
      },
      {
        name: 'lon',
        in: 'query',
        description: 'Longitude of the center, optional, must be used with "zoom" and "lat", incompatible with "bbox"',
        required: false,
        schema: {
          type: 'number',
        },
      },
      {
        name: 'lat',
        in: 'query',
        description: 'Latitude of the center, optional, must be used with "zoom" and "lon", incompatible with "bbox"',
        required: false,
        schema: {
          type: 'number',
        },
      },
      //
      {
        name: 'padding',
        in: 'query',
        description: 'Padding around the specified bbox or data (wkb or POST body), incompatible with "zoom"',
        required: false,
        schema: {
          type: 'number',
        },
      },
      {
        name: 'bbox',
        in: 'query',
        description: 'Bbox to center on, incompatible with "lon" or "lat"',
        required: false,
        schema: {
          type: 'string',
        },
      },
      //
      {
        name: 'wkb',
        in: 'query',
        description: 'A base64url encoded Wkb used draw additional data, must be used with "wkb-type"',
        required: false,
        schema: {
          type: 'string',
          format: 'base64url',
        },
      },
      {
        name: 'wkb-type',
        in: 'query',
        description: 'Type of geometry to draw, one of "fill", "line" or "circle"',
        required: false,
        schema: {
          type: 'string',
        },
      },
      {
        name: 'wkb-color',
        in: 'query',
        description: 'Color used to draw the geometry',
        required: false,
        schema: {
          type: 'string',
        },
      },
      {
        name: 'wkb-width',
        in: 'query',
        description: 'Width used as circle-radius or line-width to draw the geometry',
        required: false,
        schema: {
          type: 'number',
        },
      },
      {
        name: 'filters',
        in: 'query',
        description: 'Additionnal filter for layers, formated as filters=<layer1>:<filter1>;<layer2>:<filter2>',
        required: false,
        schema: {
          type: 'string',
        },
      },
    ],
    responses: {
      200: {
        description: 'The rendered image',
        content: {
          'image/png': {},
          'image/jpeg': {},
          'image/webp': {},
          // 'image/': {} ,
        },
      },
      404: {
        description: 'The style does not exist',
      },
    },
  },
}
router.get('/:style/:width(\\d+)x:height(\\d+).:format', asyncWrap(getOrPost))
router.post('/:style/:width(\\d+)x:height(\\d+).:format', asyncWrap(getOrPost))

async function getOrPost(req, res) {
  //
  const mapOptions = {}
  const additionalSources = {}
  const additionalLayers = []
  const imageProperties = {}
  const style = req.style.style
  style._id = req.style._id
  //

  // Image size
  const height = parseInt(req.params.height)
  const width = parseInt(req.params.width)
  if (isNaN(height)) return res.status(400).send('Invalid image height')
  if (isNaN(width)) return res.status(400).send('Invalid image width')
  if (width * height > config.imageSizeLimit) return res.status(400).send('Image size over limit')
  Object.assign(mapOptions, { width, height })
  //

  // Image format
  const format = req.params.format
  if (!['png', 'jpg', 'jpeg', 'webp'].includes(format)) return res.status(400).send('Unsupported image format')
  Object.assign(imageProperties, { format: format === 'jpg' ? 'jpeg' : format })
  //

  // zoom
  const zoom = parseFloat(req.query.zoom)
  if (req.query.zoom && isNaN(zoom)) return res.status(400).send('Query parameter "zoom" has to be a valid float')
  Object.assign(mapOptions, { zoom })
  //

  // lon lat
  if (req.query.lon || req.query.lat) {
    const lon = parseFloat(req.query.lon)
    const lat = parseFloat(req.query.lat)
    if (isNaN(lon)) return res.status(400).send('Query parameter "lon" has to be a valid float')
    if (isNaN(lat)) return res.status(400).send('Query parameter "lat" has to be a valid float')
    if (!req.query.zoom) return res.status(400).send('Query parameter "zoom" is required with "lon" and "lat"')
    Object.assign(mapOptions, { center: [lon, lat] })
  }
  //

  // padding
  const padding = parseFloat(req.query.padding)
  if (req.query.padding && isNaN(padding)) return res.status(400).send('Query parameter "padding" has to be a valid float')
  if (req.query.padding && req.query.zoom) return res.status(400).send('Query parameter "padding" and "zoom" can\'t be used together')
  //

  // bbox
  if (req.query.bbox) {
    if (req.query.lon || req.query.lat) return res.status(400).send('Query parameter "bbox" can\'t be used with "lon" or "lat"')
    const bbox = req.query.bbox.split(',').map(v => parseFloat(v))
    if (bbox.length !== 4 || bbox.some(isNaN) || bboxUtils.getCenter(bbox).some(isNaN)) return res.status(400).send('Query parameter "bbox" is not a valid bounding box')
    const center = bboxUtils.getCenter(bbox)
    Object.assign(mapOptions, { center })
    if (!mapOptions.zoom) Object.assign(mapOptions, { zoom: bboxUtils.getZoom({ width, height, padding, bbox }) })
  }
  //

  // geojson sources from wkb
  if (req.query.wkb) {
    const base64urlBuffer = Buffer.from(req.query.wkb, 'base64url')
    try {
      const geojson = wkx.Geometry.parse(base64urlBuffer).toGeoJSON()
      additionalSources.wkb = {
        type: 'geojson',
        data: geojson,
      }
    } catch (error) {
      return res.status(400).send('Query parameter "wkb" has to be a valid wkb')
    }

    if (!['fill', 'line', /* 'symbol', */ 'circle'].includes(req.query['wkb-type'])) return res.status(400).send('Query parameter "wkb-type" is not a valid layer type, it should be one of "fill", "line", "symbol" or "circle"')
    const wkbLayer = {
      id: 'wkb-layer',
      source: 'wkb',
      type: req.query['wkb-type'],
      paint: {},
      layout: {
        visibility: 'visible',
      },
    }
    if (req.query['wkb-type'] === 'fill') {
      wkbLayer.paint = {
        'fill-color': req.query['wkb-color'] || '#000000',
        'fill-opacity': 0.5,
      }
    } else if (req.query['wkb-type'] === 'line') {
      wkbLayer.paint = {
        'line-color': req.query['wkb-color'] || '#000000',
        'line-opacity': 1,
        'line-width': parseFloat(req.query['wkb-width']) || 1,
      }
    } else if (req.query['wkb-type'] === 'circle') {
      wkbLayer.paint = {
        'circle-stroke-color': req.query['wkb-color'] || '#000000',
        'circle-color': req.query['wkb-color'] || '#000000',
        'circle-opacity': 0.5,
        'circle-stroke-opacity': 1,
        'circle-radius': parseFloat(req.query['wkb-width']) || 5,
      }
    }

    additionalLayers.push(wkbLayer)
  }
  //

  // sources and layers from body
  if (req.method === 'POST' && req.body) {
    if (req.body.sources && typeof (req.body.sources) === 'object') Object.assign(additionalSources, req.body.sources)
    if (req.body.layers && Array.isArray(req.body.layers)) additionalLayers.push(req.body.layers)
  }
  //

  //
  if (!mapOptions.center && Object.keys(additionalSources).length) {
    const bbox = bboxUtils.getBBoxFromGeojsonStyleSource(additionalSources)
    const center = bboxUtils.getCenter(bbox)
    Object.assign(mapOptions, { center })
    if (!mapOptions.zoom) Object.assign(mapOptions, { zoom: bboxUtils.getZoom({ width, height, padding, bbox }) })
  }
  //

  //
  if (!mapOptions.center || isNaN(mapOptions.center[0]) || isNaN(mapOptions.center[1]) || isNaN(mapOptions.zoom)) {
    return res.status(400).send('Nothing to center on')
  }
  //

  const filters = {}
  if (req.query.filters) {
    for (const layerFilter of req.query.filters.split(';').filter(f => f)) {
      const layer = layerFilter.split(':')[0]
      if (!layer) return res.status(400).send('wrong filter format')
      try {
        const filter = JSON.parse(`[${layerFilter.split(':').slice(1).join(':')}]`)
        filters[layer] = filter
      } catch (error) {
        return res.status(400).send(error.message)
      }
    }
  }

  //
  try {
    const context = {
      cookie: req.headers.cookie,
      publicBaseUrl: req.publicBaseUrl,
      cachingSize: 0,
      additionalSources,
      additionalLayers,
      filters,
    }

    if (req.style.sprite_png) context.spritePng = req.style.sprite_png.buffer
    if (req.style.sprite_json) context.spriteJson = req.style.sprite_json

    const { buffer/*, info */ } = await req.app.get('renderer').render(style, mapOptions, imageProperties, context)

    if (!buffer) return res.status(404).send('Not found')
    res.set({ 'Content-Type': `image/${imageProperties.format}` })
    return res.status(200).send(buffer)
  } catch (error) {
    // if (error.message.match('Request failed with status code')) {
    //   return res.status(error.message.split(' ').pop()).send()
    // }
    console.error(error.stack)
    return res.status(500).send(error.message)
  }
}
