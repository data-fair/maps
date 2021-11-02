const config = require('config')
const { createPool } = require('./pool')
const maplibre = require('../utils/maplibre-gl-native')
maplibre.on('message', require('debug')('renderer:maplibre-gl-native'))

//

//

//

let pool

module.exports.start = async ({ db }) => {
  pool = createPool(db, { min: 0, max: config.maplibrePool })
  await pool.ready()
  return require('./render')(pool)
}

module.exports.stop = async () => {
  if (pool) await pool.drain()
}
