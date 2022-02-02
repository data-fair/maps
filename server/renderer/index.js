const config = require('config')
const { createPool } = require('./pool')
const maplibre = require('../utils/maplibre-gl-native')
maplibre.on('message', require('debug')('renderer:maplibre-gl-native'))

//

//

//

let pool

module.exports.start = async ({ db }) => {
  const events = new (require('events').EventEmitter)()
  pool = createPool(db, { min: 0, max: config.maplibrePool })
  await pool.ready()
  return {
    events,
    render: require('./render')({ pool, events }),
    // renderedFeatures: require('./renderedFeatures')({ pool, events }),
  }
}

module.exports.stop = async () => {
  if (pool) await pool.drain()
}
