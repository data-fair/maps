const debug = require('debug')('renderer:request')
const requestHttp = require('./request-http')
const requestInternal = require('./request-internal')

function createRequester({ db, resource }) {
  return async (req, callback) => {
    debug(req)
    // return callback(new Error('test?'), null)
    const protocol = req.url.split(':')[0]
    try {
      if (protocol === 'http' || protocol === 'https') {
        return callback(null, await requestHttp(req, { db, ...resource }))
      } else if (protocol === 'maps') {
        return callback(null, await requestInternal(req, { db, ...resource }))
      } else {
        return callback(new Error(`unsupported protocol: ${protocol}`), null)
      }
    } catch (error) {
      console.error(error.message)
      return callback(error, null)
    }
  }
}

module.exports = createRequester
