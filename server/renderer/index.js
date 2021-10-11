const { createPool } = require('generic-pool')
const debugPool = require('debug')('renderer:pool')
const maplibre = require('../utils/maplibre-gl-native')
maplibre.on('message', require('debug')('renderer:maplibre-gl-native'))

//

//

//

let pool
module.exports.start = async ({ db }) => {
  const factory = {
    create: async() => {
      debugPool('creating a new map')
      const resource = {
        cache: {},
      }
      resource.map = maplibre.Map({
        request: require('./request')({ resource, db }),
      })
      debugPool('map created')
      return resource
    },
    clean: async (resource) => {
      Object.keys(resource.cache).forEach(k => delete resource.cache[k])
    },
    destroy: async(resource) => {
      debugPool('destroy called')
      resource.map.release()
    },
  }
  pool = createPool(factory)
  await pool.ready()
  return pool
}

module.exports.stop = async () => {
  if (pool) await pool.drain()
}
