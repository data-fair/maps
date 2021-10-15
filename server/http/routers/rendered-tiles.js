const mercator = new (require('@mapbox/sphericalmercator'))()

const router = module.exports = require('express').Router()
router.param('style', require('../params/style'))

//

//

//

router.get('/:style', async (req, res) => {
  res.send(req.style)
})

router.get('/:style/:z/:x/:y.png', async (req, res) => {
  const z = req.params.z | 0
  const x = req.params.x | 0
  const y = req.params.y | 0
  const size = 256
  const width = (z === 0 ? 2 : 1) * size
  const height = width
  const [lon, lat] = mercator.ll([(x + 0.5) * 256, (y + 0.5) * 256], z)
  const mapOptions = {
    zoom: Math.max(z - 1, 0),
    center: [lon, lat],
    width,
    height,
  }
  const imageFormat = {
    format: 'png',
    widht: size,
    height: size,
  }

  try {
    const { buffer, info } = await req.app.get('renderer').render(req.style, mapOptions, imageFormat, { cookie: req.headers.cookie, publicBaseUrl: req.publicBaseUrl })

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
})
