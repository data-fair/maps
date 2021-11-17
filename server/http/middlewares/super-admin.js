
const config = require('config')
const asyncWrap = require('../../utils/async-wrap')

let basePath = new URL(config.publicUrl).pathname
if (!basePath.endsWith('/')) basePath += '/'

module.exports = asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send('SuperAdmin required')
  if (!req.user.adminMode) return res.status(403).send('SuperAdmin required')
  next()
})
