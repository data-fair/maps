const config = require('config')

module.exports = {
  version: 8,
  name: 'public-url-style',
  sources: {
    domain1Source: {
      type: 'vector',
      url: config.publicUrl + '/tilesets/test.json',
    },
    domain2Source: {
      type: 'vector',
      url: config.publicUrl2 + '/tilesets/test.json',
    },
    externalSource: {
      type: 'vector',
      url: 'http://test.com/tilesets/test.json',
    },
  },
  glyphs: 'maps://fonts/{fontstack}/{range}.pbf',
  layers: [],
}
