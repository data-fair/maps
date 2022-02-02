
const config = require('config')
const semver = require('semver')
const bboxUtils = require('../../utils/bbox')
const { generateInspectStyle } = require('../../utils/style')
const lastModifiedMiddleware = require('../middlewares/last-modified')

const asyncWrap = require('../../utils/async-wrap')

const router = module.exports = require('express').Router({ mergeParams: true })

//

require('../api-docs').paths['/tilesets/{tileset}/preview/{width}x{height}.png'] = { get: {} }
router.use(require('../params/tileset'))

//

//

//

require('../api-docs').paths['/tilesets/{tileset}/preview/{width}x{height}.png'].get = {
  tags: ['Tilesets'],
  summary: 'Get the preview of the tileset',
  parameters: [
    { $ref: '#/components/parameters/tileset' },
    {
      name: 'width',
      in: 'path',
      description: 'Width of the preview',
      required: true,
      schema: {
        type: 'integer',
      },
    },
    {
      name: 'height',
      in: 'path',
      description: 'Height of the preview',
      required: true,
      schema: {
        type: 'integer',
      },
    },
  ],
  responses: {
    200: {
      description: 'Image preview of the tileset',
      content: { 'image/png': {} },
    },
    404: {
      description: 'The tileset does not exist',
    },
  },
}

router.get('/:width(\\d+)x:height(\\d+).png', lastModifiedMiddleware((req) => req?.tilesetInfo?.lastModified), asyncWrap(async (req, res) => {
  const mapOptions = {
    height: parseInt(req.params.height),
    width: parseInt(req.params.width),
  }
  if (isNaN(mapOptions.height)) return res.status(400).send('Invalid image height')
  if (isNaN(mapOptions.width)) return res.status(400).send('Invalid image width')
  if (mapOptions.width * mapOptions.height > config.imageSizeLimit) return res.status(400).send('Image size over limit')

  if (req.tilesetInfo.center?.length === 3) {
    mapOptions.center = [req.tilesetInfo.center[0], req.tilesetInfo.center[1]]
    mapOptions.zoom = req.tilesetInfo.center[2]
  } else if (req.tilesetInfo.bounds) {
    const bbox = req.tilesetInfo.bounds
    mapOptions.center = bboxUtils.getCenter(bbox)
    mapOptions.zoom = bboxUtils.getZoom({ width: mapOptions.width, height: mapOptions.height, bbox })
  } else {
    const TileJSONs = await req.app.get('db').collection('import-tilesets').find({ tileset: req.params.tileset }).toArray()
    const bbox = bboxUtils.mergeBBoxes(TileJSONs.map(t => t.tilejson?.bounds).filter(bbox => bbox))
    mapOptions.center = bboxUtils.getCenter(bbox)
    mapOptions.zoom = bboxUtils.getZoom({ width: mapOptions.width, height: mapOptions.height, bbox })
  }

  const style = generateInspectStyle({
    sources: {
      tileset: {
        ...req.tilesetInfo,
        type: req.tilesetInfo.format === 'pbf' ? 'vector' : 'raster',
        tiles: ['maps://api/tilesets/' + req.tilesetInfo._id + ':' + semver.major(req.tilesetInfo.version) + '/tiles/{z}/{x}/{y}.' + req.tilesetInfo.format],
      },
    },
    layers: [],
  })
  const context = {
    cookie: req.headers.cookie,
    publicBaseUrl: req.publicBaseUrl,
    cachingSize: 0,
  }
  try {
    const { buffer/*, info */ } = await req.app.get('renderer').render(style, mapOptions, { format: 'png' }, context)

    if (!buffer) return res.status(404).send('Not found')
    res.set({ 'Content-Type': 'image/png' })
    return res.status(200).send(buffer)
  } catch (error) {
    console.error(error.stack)
    return res.status(500).send(error.message)
  }
}))
