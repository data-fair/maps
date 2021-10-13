const mercator = new (require('@mapbox/sphericalmercator'))()
const sharp = require('sharp')
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

  const imageBuffer = await req.app.get('renderer').use((resource) => new Promise((resolve, reject) => {
    resource.map.load(req.style)
    resource.map.render({
      zoom: Math.max(z - 1, 0),
      center: [lon, lat],
      width,
      height,
    }, (err, buffer) => {
      if (err) return reject(err)
      resolve(buffer)
    })
  }))

  const image = sharp(imageBuffer, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
  if (z === 0) image.resize(width / 2, height / 2)
  image.png({ adaptiveFiltering: false })
  image.toBuffer((err, buffer, info) => {
    if (err) return res.status(500).send(err.message)
    if (!buffer) {
      return res.status(404).send('Not found')
    }

    res.set({
      'Content-Type': 'image/png',
    })
    return res.status(200).send(buffer)
  })
})
