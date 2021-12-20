const asyncWrap = require('../../utils/async-wrap')
const assert = require('assert')

module.exports = (getLastModifiedDate) => {
  assert.equal(typeof (getLastModifiedDate), 'function')

  return asyncWrap(async (req, res, next) => {
    const serverModifiedDate = Date.parse(await Promise.resolve(getLastModifiedDate(req)))
    if (!serverModifiedDate) return next()
    req.set({ 'Last-Modified': serverModifiedDate.toUTCString() })

    if (!req?.headers?.['If-Modified-Since']) return next()
    const clientModifiedDate = Date.parse(req?.headers?.['If-Modified-Since'])

    if (clientModifiedDate >= serverModifiedDate) res.sendStatus(304)
    else next()
  })
}
