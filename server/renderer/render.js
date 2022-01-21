const sharp = require('sharp')
const debug = require('debug')('renderer:render')
const { nanoid } = require('nanoid')
const prometheus = require('../prometheus')

const events = new (require('events').EventEmitter)()

module.exports = (pool) => ({
  events,
  async render(style, mapOptions, imageProperties, context = {}) {
    const renderId = nanoid()
    const imageBuffer = await pool.use((resource) => new Promise((resolve, reject) => {
      try {
        events.emit('render', { style, mapOptions, imageProperties, context })
        const reuseOldStyle = !!(style._id && resource.oldStyle && resource.oldStyle === style._id)
        const end = prometheus.maplibre_render_timer.labels(reuseOldStyle).startTimer()
        debug('start render ', renderId)
        // prometheus.maplibre_reuse_style.labels(reuseOldStyle).inc(1)
        resource.context = context
        if (!reuseOldStyle) {
          resource.map.load(style)
          resource.oldStyle = style._id
        }

        for (const source in context.additionalSources || {}) resource.map.addSource(source, context.additionalSources[source])
        for (const layer of (context.additionalLayers || []).flat()) resource.map.addLayer(layer)
        for (const filter in context.filters || {}) resource.map.setFilter(filter, style.layers.find(l => l.id === filter)?.filter ? ['all', style.layers.find(l => l.id === filter).filter, context.filters[filter]] : context.filters[filter])
        if (Object.keys(context.filters || {}).length) resource.oldStyle = undefined

        resource.map.render(mapOptions, (err, buffer) => {
          for (const layer of (context.additionalLayers || []).flat()) resource.map.removeLayer(layer.id)
          for (const source in context.additionalSources || {}) resource.map.removeSource(source)
          delete resource.context

          resource.map.reduceMemoryUse()
          end()
          debug('end render ', renderId)

          if (err) reject(err)
          else resolve(buffer)
        })
      } catch (error) {
        console.error(error)
        reject(error)
      }
    }))

    const image = sharp(imageBuffer, {
      raw: {
        width: mapOptions.width,
        height: mapOptions.height,
        channels: 4,
      },
    })

    if ((mapOptions.width !== imageProperties.width || mapOptions.height !== imageProperties.height) && imageProperties.width && imageProperties.height) {
      image.resize(imageProperties.width, imageProperties.height)
    }

    if (imageProperties.format === 'png') {
      image.png()
    } else if (imageProperties.format === 'jpeg') {
      image.jpeg()
    } else if (imageProperties.format === 'webp') {
      image.webp()
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
