
const bboxUtils = require('../../utils/bbox')
const wkx = require('wkx')
const router = module.exports = require('express').Router()
router.param('style', require('../params/style'))

//

//

//

router.get('/:style/:width(\\d+)x:height(\\d+).:format', getOrPost)
router.post('/:style/:width(\\d+)x:height(\\d+).:format', getOrPost)

async function getOrPost(req, res) {
  req.style = JSON.parse(JSON.stringify(req.style))
  if (req.body && !Object.keys(req.body).length) delete req.body
  const height = parseInt(req.params.height)
  const width = parseInt(req.params.width)
  const { query, body } = req
  const mapOptions = { width, height }
  const padding = query.padding ? parseFloat(query.padding) : undefined

  // Load data
  let geojson
  if (body && body.sources && body.layers) {
    req.style = JSON.parse(JSON.stringify(req.style))
    req.style.sources = Object.assign(req.style.sources || {}, body.sources)
    req.style.layers = req.style.layers.concat(body.layers)
    geojson = body.sources
  }

  if (query['data-sources']) {
    req.style = JSON.parse(JSON.stringify(req.style))

    query['data-sources'].split(',').filter(d => query[d]).forEach((dataSource) => {
      req.style.sources[dataSource] = req.style.sources[dataSource] || {
        type: 'geojson',
      }
      req.style.sources[dataSource].data = wkx.Geometry.parse(Buffer.from(query[dataSource], 'base64url')).toGeoJSON()
      geojson = req.style.sources[dataSource]
    })
  }

  // Center and zoom

  if (query.lon && query.lat && query.zoom) {
    const lon = parseFloat(query.lon)
    const lat = parseFloat(query.lat)
    const zoom = parseFloat(query.zoom)
    mapOptions.center = [lon, lat]
    mapOptions.zoom = zoom
  } else if (query.bbox) {
    const bbox = query.bbox.split(',').map(v => parseFloat(v))
    if (bbox.length !== 4 || bbox.some(isNaN)) return res.status(400).send('query.bbox is not a valid bounding box')
    mapOptions.center = bboxUtils.getCenter(bbox)
    mapOptions.zoom = bboxUtils.getZoom({ width, height, padding, bbox })
  } else if (geojson) { // auto
    const bbox = bboxUtils.getBBoxFromGeojsonStyleSource(req.style.sources)
    mapOptions.center = bboxUtils.getCenter(bbox)
    mapOptions.zoom = bboxUtils.getZoom({ width, height, padding, bbox })
  } else {
    return res.status(400).send('Nothing to center on')
  }

  if (isNaN(mapOptions.center[0])) return res.status(400).send('lon is not a valid float')
  if (isNaN(mapOptions.center[1])) return res.status(400).send('lat is not a valid float')
  if (isNaN(mapOptions.zoom)) return res.status(400).send('zoom is not a valid float')
  //
  // if (query.debug) {
  //   return res.send({ query, body, mapOptions, params: req.params })
  //   // return res.send(req.style)
  // }
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
