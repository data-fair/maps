const debug = require('debug')('renderer:request')
const requestHttp = require('./request-http')
const requestInternal = require('./request-internal')
const prometheus = require('../prometheus')
const { Resource: resourceType } = require('../utils/maplibre-gl-native')

const kinds = Object.fromEntries(Object.entries(resourceType).map(v => v.reverse()))

function createRequester({ db, resource }) {
  return async (req, callback) => {
    const end = prometheus.maplibre_request_timer.startTimer()
    debug(req)
    // return callback(new Error('test?'), null)
    const protocol = req.url.split(':')[0]
    const internal = !(protocol === 'http' || protocol === 'https')
    try {
      if (!internal) {
        return callback(null, await requestHttp(req, { db, ...resource }))
      } else if (protocol === 'maps') {
        return callback(null, await requestInternal(req, { db, ...resource }))
      } else {
        return callback(new Error(`unsupported protocol: ${protocol}`), null)
      }
    } catch (error) {
      console.error(req, error.stack)
      return callback(error, null)
    } finally {
      end({ internal, kind: kinds[req.kind] })
    }
  }
}

module.exports = createRequester
