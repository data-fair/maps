const tiletype = require('@mapbox/tiletype')
const memoizee = require('memoizee')

const router = module.exports = require('express').Router()

//

let getCachedTilesetInfo
router.param('tileset', async (req, res, next) => {
  if (!getCachedTilesetInfo) {
    getCachedTilesetInfo = memoizee(async (tileset) => {
      return await req.app.get('db').collection('tilesets').findOne({ _id: tileset })
    }, { maxAge: 10000, promise: true })
  }

  req.tilesetInfo = await getCachedTilesetInfo(req.params.tileset)
  if (!req.tilesetInfo) { return res.sendStatus(404) }
  next()
})

//

router.get('/:tileset/:z/:x/:y.pbf', async (req, res) => {
  const query = {
    ts: req.params.tileset,
    x: parseInt(req.params.x),
    y: parseInt(req.params.y),
    z: parseInt(req.params.z),
  }

  const tile = await req.app.get('db').collection('tiles').findOne(query)
  if (!tile) { return res.sendStatus(204) }

  const headers = tiletype.headers(tile.d.buffer)
  delete headers.ETag

  res.set(headers)
  res.send(tile.d.buffer)
})

router.get('', async (req, res) => {
  const tilesetInfos = await req.app.get('db').collection('tilesets').find({}).toArray()
  res.send(tilesetInfos.map((tilesetInfo) => {
    tilesetInfo.tiles = [`${req.publicBaseUrl}/tiles/${tilesetInfo._id}/{z}/{x}/{y}.pbf`]
    return tilesetInfo
  }))
})

router.get('/:tileset.json', async (req, res) => {
  req.tilesetInfo.tiles = [
    `${req.publicBaseUrl}/tiles/${req.params.tileset}/{z}/{x}/{y}.pbf`,
  ]
  res.send(req.tilesetInfo)
})
