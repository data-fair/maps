
const bboxUtils = require('../../utils/bbox')
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

  // Center and zoom

  if (query.lon && query.lat && query.zoom) {
    const lon = parseFloat(query.lon)
    if (isNaN(lon)) return res.status(400).send('query.lon is not a valid float')
    const lat = parseFloat(query.lat)
    if (isNaN(lat)) return res.status(400).send('query.lat is not a valid float')
    const zoom = parseFloat(query.zoom)
    if (isNaN(zoom)) return res.status(400).send('query.zoom is not a valid float')
    mapOptions.center = [lon, lat]
    mapOptions.zoom = zoom
  } else if (query.bbox) {
    const bbox = query.bbox.split(',').map(v => parseFloat(v))
    if (bbox.length !== 4 || bbox.some(isNaN)) return res.status(400).send('query.bbox is not a valid bounding box')
    mapOptions.center = bboxUtils.getCenter(bbox)
    mapOptions.zoom = bboxUtils.getZoom({ width, height, padding, bbox })
  } else if (body) { // auto
    const bbox = bboxUtils.getBBoxFromGeojsonStyleSource(body.data)
    mapOptions.center = bboxUtils.getCenter(bbox)
    mapOptions.zoom = bboxUtils.getZoom({ width, height, padding, bbox })
  } else {
    return res.status(400).send()
  }

  //

  if (body && body.data && body.layers) {
    req.style = JSON.parse(JSON.stringify(req.style))
    req.style.sources = Object.assign(req.style.sources || {}, body.data)
    req.style.layers = req.style.layers.concat(body.layers)
  }

  // if (query.debug) {
  //   return res.send({ query, body, mapOptions, params: req.params })
  //   // return res.send(req.style)
  // }
  try {
    const { buffer, info } = await req.app.get('renderer').render(req.style, mapOptions, { format: 'png' }, { cookie: req.headers.cookie })

    if (!buffer) return res.status(404).send('Not found')
    res.set({
      'Content-Type': 'image/png',
    })
    return res.status(200).send(buffer)
  } catch (error) {
    if (error.message.match('Request failed with status code')) {
      return res.status(error.message.split(' ').pop()).send()
    }
  }
}
