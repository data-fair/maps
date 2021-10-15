
const { Resource: resourceType } = require('../utils/maplibre-gl-native')
const zlib = require('zlib')
const { getFonts } = require('../utils/fonts')

module.exports = async (req, { db, context }) => {
  context.cache = context.cache || {}
  context.cachingSize = Math.max(context.cachingSize || 0, 0)
  if (req.kind === resourceType.Unknown || !req.kind || !req.url) {

    //
  } else if (req.kind === resourceType.Style) {
    throw new Error()

    //
  } else if (req.kind === resourceType.Source) {
    if (!req.url.match('^maps://tiles/[\\w\\-]*\\.json$')) throw new Error(req.url)
    const tileInfo = await db.collection('tilesets').findOne({ _id: req.url.split('/').pop().split('.')[0] })
    tileInfo.tiles = ['maps://tiles/' + tileInfo._id + '/{z}/{x}/{y}.' + tileInfo.format]
    return { data: Buffer.from(JSON.stringify(tileInfo)) }// callback(null, { data:  })

    //
  } else if (req.kind === resourceType.Tile) {
    if (!req.url.match('^maps://tiles/[\\w\\-]*/\\d*/\\d*/\\d*\\.(pbf)|(png)$')) throw new Error(req.url)

    const args = req.url.split('/')
    const x = parseInt(args[5])
    const y = parseInt(args[6].split('.')[0])
    const z = parseInt(args[4])
    const query = { ts: args[3], z, x, y }
    context.cachingSize = Math.max(context.cachingSize || 0, 0)

    // if (true === true) {
    if (!context.cache[`${z}/${x}/${y}`]) {
      query.x = { $gte: x - context.cachingSize, $lte: x + context.cachingSize }
      const promise = db.collection('tiles').find(query).toArray()
      for (let index = -context.cachingSize; index <= context.cachingSize; index++) {
        context.cache[`${z}/${x + index}/${y}`] = promise.then((tiles) => {
          return tiles.find((t) => t.x === x + index)
        })
      }
    }

    const tile = await context.cache[`${z}/${x}/${y}`]
    return { data: zlib.unzipSync(tile.d.buffer) }
    // } else {
    //   const tile = await db.collection('tiles').findOne(query)
    //   return callback(null, { data: zlib.unzipSync(tile.d.buffer) })
    // }

    //
  } else if (req.kind === resourceType.Glyphs) {
    if (!req.url.match('^maps://fonts/.*/\\d+\\-\\d+.pbf$')) throw new Error(req.url)
    const args = req.url.split('/')
    const fontStack = decodeURI(args[3])
    const range = args[4].split('.')[0]
    return { data: await getFonts(fontStack, range) }

    //
  } else if (req.kind === resourceType.SpriteImage) {
    // return callback(null, { data: Buffer.from('') })

    //
  } else if (req.kind === resourceType.SpriteJSON) {
    // return callback(null, { data: Buffer.from('') })

    //
  }
  throw new Error('resource not found : ' + req.url)
}
