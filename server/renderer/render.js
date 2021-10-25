const sharp = require('sharp')
const debug = require('debug')('renderer:render')
const { nanoid } = require('nanoid')

const events = new (require('events').EventEmitter)()

module.exports = (pool) => ({
  events,
  async render(style, mapOptions, imageProperties, context = {}) {
    const renderId = nanoid()
    const imageBuffer = await pool.use((resource) => new Promise((resolve, reject) => {
      events.emit('render', { style, mapOptions, imageProperties, context })
      debug('start render ', renderId)
      resource.context = context
      resource.map.load(style)
      resource.map.render(mapOptions, (err, buffer) => {
        delete resource.context

        debug('end render ', renderId)
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
      image.png()
    } else if (imageProperties.format === 'jpeg') {
      image.jpeg()
    }

    const { buffer, info } = await new Promise((resolve, reject) => {
      image.toBuffer((err, buffer, info) => {
        if (err) reject(err)
        else resolve({ buffer, info })
      })
    })
    debug('image ready ', renderId)
    return { buffer, info }
  },
})
