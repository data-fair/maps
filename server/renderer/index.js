const { createPool } = require('./pool')
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
      try {
        resource.map = maplibre.Map({
          request: require('./request')({ resource, db }),
        })
        // console.log(resource.map)
        // resource.map.on('message', require('debug')('renderer:maplibre-gl-native'))
      } catch (error) {
        console.error(error.message)
        process.exit(1)
      }
      debugPool('map created')
      return resource
    },
    clean: async (resource) => {
      Object.keys(resource.cache).forEach(k => { delete resource.cache[k] })
      delete resource.cachingSize
    },
    destroy: async(resource) => {
      debugPool('destroy called')
      resource.map.release()
    },
  }
  pool = createPool(factory, { min: 1, max: 1 })
  await pool.ready()
  return pool
}

module.exports.stop = async () => {
  if (pool) await pool.drain()
}
