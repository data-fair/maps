const { createPool } = require('generic-pool')
const debugPool = require('debug')('renderer:pool')
const maplibre = require('../utils/maplibre-gl-native')

//

//

//

module.exports = {
  createPool: (db, options) => {
    return createPool(createFactory(db), options)
  },
}

function createFactory(db) {
  return {
    create: async() => {
      debugPool('creating a new map')
      const resource = {
        cache: {},
      }
      try {
        resource.map = maplibre.Map({
          request: require('./request')({ resource, db }),
        })
      } catch (error) {
        console.error(error.message)
        process.exit(1)
      }
      debugPool('map created')
      return resource
    },
    destroy: async(resource) => {
      debugPool('destroy called')
      resource.map.release()
    },
  }
}
