// const mercator = new (require('@mapbox/sphericalmercator'))()
const sharp = require('sharp')
// const FLOAT_PATTERN = '[+-]?(?:\\d+|\\d+\.?\\d+)'
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

  if (query.debug) {
    return res.send({ query, body, mapOptions, params: req.params })
    // return res.send(req.style)
  }

  const imageBuffer = await req.app.get('renderer').use((resource) => new Promise((resolve, reject) => {
    resource.map.load(req.style)
    resource.map.render(mapOptions, (err, buffer) => {
      if (err) reject(err)
      else resolve(buffer)
    })
  }))
  const image = sharp(imageBuffer, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
  // if (z === 0) image.resize(width / 2, height / 2)
  image.png({ adaptiveFiltering: false })
  image.toBuffer((err, buffer, info) => {
    if (err) return res.status(500).send(err.message)
    if (!buffer) return res.status(404).send('Not found')
    res.set({
      'Content-Type': 'image/png',
    })
    return res.status(200).send(buffer)
  })
}
// router.post('/:style/:z/:x/:y.png', async (req, res) => {
//   const z = req.params.z | 0
//   const x = req.params.x | 0
//   const y = req.params.y | 0
//   const size = 256
//   const width = (z === 0 ? 2 : 1) * size
//   const height = width
//   const [lon, lat] = mercator.ll([(x + 0.5) * 256, (y + 0.5) * 256], z)

// })
