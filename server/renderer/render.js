const sharp = require('sharp')

module.exports = (pool) => ({
  async render(style, mapOptions, imageProperties) {
    const imageBuffer = await pool.use((resource) => new Promise((resolve, reject) => {
      resource.map.load(style)
      resource.map.render(mapOptions, (err, buffer) => {
        Object.keys(resource.cache).forEach(k => { delete resource.cache[k] })
        delete resource.cachingSize

        if (err) reject(err)
        else resolve(buffer)
      })
    }))

    const image = sharp(imageBuffer, {
      raw: {
        width: mapOptions.width,
        height: mapOptions.height,
        channels: 4,
      },
    })

    if ((mapOptions.width !== imageProperties.width || mapOptions.height !== imageProperties.height) && imageProperties.width && imageProperties.height) {
      console.log('resize')
      image.resize(imageProperties.width, imageProperties.height)
    }

    if (imageProperties.format === 'png') {
      image.png({ adaptiveFiltering: false })
    }

    const { buffer, info } = await new Promise((resolve, reject) => {
      image.toBuffer((err, buffer, info) => {
        if (err) reject(err)
        else resolve({ buffer, info })
      })
    })
    return { buffer, info }
  },
})