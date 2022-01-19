
const { Resource: resourceType } = require('../utils/maplibre-gl-native')
const zlib = require('zlib')
const { getFonts } = require('../utils/fonts')
const semver = require('semver')
module.exports = async (req, { db, context }) => {
  context = context || {}
  context.cache = context.cache || {}
  context.cachingSize = Math.max(context.cachingSize || 0, 0)
  if (req.kind === resourceType.Unknown || !req.kind || !req.url) {

    //
  } else if (req.kind === resourceType.Style) {
    throw new Error()

    //
  } else if (req.kind === resourceType.Source) {
    if (!req.url.match('^maps://api/tilesets/[\\w\\-]*\\.json$')) throw new Error(req.url)
    const tileInfo = await db.collection('tilesets').findOne({ _id: req.url.split('/').pop().split('.')[0] })
    if (!tileInfo) throw new Error('Tileset does not exist : ' + req.url)
    tileInfo.tiles = ['maps://api/tilesets/' + tileInfo._id + ':' + semver.major(tileInfo.version) + '/tiles/{z}/{x}/{y}.' + tileInfo.format]
    return { data: Buffer.from(JSON.stringify(tileInfo)) }// callback(null, { data:  })

    //
  } else if (req.kind === resourceType.Tile) {
    if (!req.url.match('^maps://api/tilesets/[\\w\\-]*:[0-9]*/tiles/\\d*/\\d*/\\d*\\.(pbf)|(png)|(jpg)$')) throw new Error(req.url)

    const args = req.url.split('/')
    const x = parseInt(args[7])
    const y = parseInt(args[8].split('.')[0])
    const z = parseInt(args[6])
    const v = parseInt(args[4].split(':')[1])
    const ts = args[4].split(':')[0]
    const format = req.url.split('.').pop()
    const query = { ts, z, x, y, v }
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

    if (!tile) {
      return { data: Buffer.from('') }
    }
    if (format === 'pbf') {
      return { data: zlib.unzipSync(tile.d.buffer) }
    } else {
      return { data: tile.d.buffer }
    }
    // } else {
    //   const tile = await db.collection('tiles').findOne(query)
    //   return callback(null, { data: zlib.unzipSync(tile.d.buffer) })
    // }

    //
  } else if (req.kind === resourceType.Glyphs) {
    if (!req.url.match('^maps://api/fonts/.*/\\d+\\-\\d+.pbf$')) throw new Error(req.url)
    const args = req.url.split('/')
    const fontStack = unescape(args[4])
    const range = args[5].split('.')[0]
    return { data: await getFonts(fontStack, range) }

    //
  } else if (req.kind === resourceType.SpriteImage) {
    if (context.spritePng) return { data: Buffer.from(context.spritePng) }
    else return { data: (await db.collection('styles').findOne({ _id: req.url.split('/').at(-2) })).sprite_png.buffer }
  } else if (req.kind === resourceType.SpriteJSON) {
    if (context.spriteJson) return { data: Buffer.from(JSON.stringify(context.spriteJson)) }
    else return { data: Buffer.from(JSON.stringify((await db.collection('styles').findOne({ _id: req.url.split('/').at(-2) })).sprite_json)) }
  }
  throw new Error('resource not found : ' + req.url + ' ' + req.kind)
}
