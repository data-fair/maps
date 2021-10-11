const { Resource: resourceType } = require('../utils/maplibre-gl-native')
const zlib = require('zlib')

function createRequester({ db, resource }) {
  return async (req, callback) => {
    if (req.kind === resourceType.Unknown || !req.kind || !req.url) {

      //
    } else if (req.kind === resourceType.Style) {
      return callback(new Error()) // it should never request a style
      // if (!req.url.match('^maps://styles/\\w*')) return callback(new Error())
      // const style = await db.collection('styles').findOne({})
      // const data = JSON.stringify(style)
      // return callback(null, { data })

      //
    } else if (req.kind === resourceType.Source) {
      if (!req.url.match('^maps://tiles/[\\w\\-]*\\.json$')) return callback(new Error(req.url))
      const tileInfo = await db.collection('tilesets').findOne({ _id: req.url.split('/').pop().split('.')[0] })
      tileInfo.tiles = ['maps://tiles/' + tileInfo._id + '/{z}/{x}/{y}.' + tileInfo.format]
      return callback(null, { data: Buffer.from(JSON.stringify(tileInfo)) })

      //
    } else if (req.kind === resourceType.Tile) {
      if (!req.url.match('^maps://tiles/[\\w\\-]*/\\d*/\\d*/\\d*\\.(pbf)|(png)$')) return callback(new Error(req))
      const args = req.url.split('/')
      const query = {
        ts: args[3],
        z: parseInt(args[4]),
        x: parseInt(args[5]),
        y: parseInt(args[6].split('.')[0]),
      }
      const tile = await db.collection('tiles').findOne(query)
      return callback(null, { data: zlib.unzipSync(tile.d.buffer) })

      //
    } else if (req.kind === resourceType.Glyphs) {
      return callback(null, { data: Buffer.from('') })

      //
    } else if (req.kind === resourceType.SpriteImage) {
      return callback(null, { data: Buffer.from('') })

      //
    } else if (req.kind === resourceType.SpriteJSON) {
      return callback(null, { data: Buffer.from('') })

      //
    }
  }
}

module.exports = createRequester
