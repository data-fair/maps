const memoizee = require('memoizee')
const asyncWrap = require('../../utils/async-wrap')
require('../api-docs').components.parameters.tileset = {
  name: 'tileset',
  in: 'path',
  description: 'id of the tileset',
  required: true,
}

let getCachedTilesetInfo
module.exports = asyncWrap(async (req, res, next) => {
  if (!getCachedTilesetInfo) {
    getCachedTilesetInfo = memoizee(async (tileset) => {
      return await req.app.get('db').collection('tilesets').findOne({ _id: tileset })
    }, { maxAge: 10000, promise: true })
  }

  req.tilesetInfo = await getCachedTilesetInfo(req.params.tileset)
  if (!req.tilesetInfo) { return res.sendStatus(404) }
  next()
})
