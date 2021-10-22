
const bboxUtils = require('../../utils/bbox')
const wkx = require('wkx')
const router = module.exports = require('express').Router()
router.param('style', require('../params/style'))

//

//

//

require('../api-docs').paths['/render/{style}/{width}x{height}.{format}'] = {}
router.get('/:style/:width(\\d+)x:height(\\d+).:format', getOrPost)
router.post('/:style/:width(\\d+)x:height(\\d+).:format', getOrPost)

async function getOrPost(req, res) {
  //
  const mapOptions = {}
  const additionalSources = {}
  const additionalLayers = []
  //

  // Image size
  const height = parseInt(req.params.height)
  const width = parseInt(req.params.width)
  if (isNaN(height)) return res.status(400).send('Invalid image height')
  if (isNaN(width)) return res.status(400).send('Invalid image width')
  if (width * height > 1000000) return res.status(400).send('Image size over limit')
  Object.assign(mapOptions, { width, height })
  //

  // Image format
  const format = req.params.format
  if (!['png'].includes(format)) return res.status(400).send('Unsupported image format')
  //

  // zoom
  const zoom = parseFloat(req.query.zoom)
  if (req.query.zoom && isNaN(zoom)) return res.status(400).send('Query parameter "zoom" has to be a valid float')
  else Object.assign(mapOptions, { zoom })
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
  //

  // bbox
  if (req.query.bbox) {
    if (req.query.lon || req.query.lat) return res.status(400).send('Query parameter "bbox" can\'t be used with "lon" or "lat"')
    const bbox = req.query.bbox.split(',').map(v => parseFloat(v))
    if (bbox.length !== 4 || bbox.some(isNaN) || bboxUtils.getCenter(bbox).some(isNaN)) return res.status(400).send('Query parameter "bbox" is not a valid bounding box')
    const center = bboxUtils.getCenter(bbox)
    Object.assign(mapOptions, { center })
    if (!req.query.zoom) Object.assign(mapOptions, { zoom: bboxUtils.getZoom({ width, height, padding, bbox }) })
  }
  //

  // geojson sources from wkb
  if (req.query['wkb-sources']) {
    for (const sourceName of req.query['wkb-sources'].split(',')) {
      if (!req.query[sourceName]) return res.status(400).send(`Query parameter "${sourceName}" is specified in "wkb-sources" but not present in query`)
      const base64urlBuffer = Buffer.from(req.query[sourceName], 'base64url')
      try {
        const geojson = wkx.Geometry.parse(base64urlBuffer).toGeoJSON()
        additionalSources[sourceName] = {
          type: 'geojson',
          data: geojson,
        }
      } catch (error) {
        return res.status(400).send(`Query parameter "${sourceName}" has to be a valid wkb`)
      }
    }
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
    mapOptions.center = bboxUtils.getCenter(bbox)
    if (!req.query.zoom) mapOptions.zoom = bboxUtils.getZoom({ width, height, padding, bbox })
  }
  //

  //
  if (!mapOptions.center || isNaN(mapOptions.center[0]) || isNaN(mapOptions.center[1]) || isNaN(mapOptions.zoom)) {
    return res.status(400).send('Nothing to center on')
  }
  //

  //

  // update style
  if (Object.keys(additionalSources).length || additionalLayers.length) {
    req.style = JSON.parse(JSON.stringify(req.style))
    Object.assign(req.style.sources, additionalSources || {})
    req.style.layers = req.style.layers.concat(additionalLayers.flat())
  }

  try {
    const { buffer/*, info */ } = await req.app.get('renderer').render(req.style, mapOptions, { format: 'png' }, { cookie: req.headers.cookie, publicBaseUrl: req.publicBaseUrl })

    if (!buffer) return res.status(404).send('Not found')
    res.set({
      'Content-Type': 'image/png',
    })
    return res.status(200).send(buffer)
  } catch (error) {
    if (error.message.match('Request failed with status code')) {
      return res.status(error.message.split(' ').pop()).send()
    }
    return res.status(500).send()
  }
}
