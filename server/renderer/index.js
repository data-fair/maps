const { createPool } = require('./pool')
const maplibre = require('../utils/maplibre-gl-native')
maplibre.on('message', require('debug')('renderer:maplibre-gl-native'))

//

//

//

let pool

module.exports.start = async ({ db }) => {
  pool = createPool(db, { min: 1, max: 1 })
  await pool.ready()
  return require('./render')(pool)
}

module.exports.stop = async () => {
  if (pool) await pool.drain()
}
