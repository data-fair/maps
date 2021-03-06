
const config = require('config')
const asyncWrap = require('../../utils/async-wrap')

let basePath = new URL(config.publicUrl).pathname
if (!basePath.endsWith('/')) basePath += '/'

module.exports = asyncWrap(async (req, res, next) => {
  if (req.method === 'GET') return next()
  require('./super-admin')(req, res, next)
})
