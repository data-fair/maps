const config = require('config')

module.exports = {
  version: 8,
  name: 'public-url-style',
  sources: {
    domain1Source: {
      type: 'vector',
      url: config.publicUrl + '/tiles/test.json',
    },
    domain2Source: {
      type: 'vector',
      url: config.publicUrl2 + '/tiles/test.json',
    },
    externalSource: {
      type: 'vector',
      url: 'http://test.com/tiles/test.json',
    },
  },
  sprite: config.publicUrl2 + '/sprites/test',
  glyphs: 'maps://fonts/{fontstack}/{range}.pbf',
  layers: [],
}
