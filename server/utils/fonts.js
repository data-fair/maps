const { combine } = require('@mapbox/glyph-pbf-composite')
const fs = require('fs/promises')
module.exports = { getFonts }

async function getFonts(fontStack, range) {
  const fontList = fontStack.split(',')
  const fonts = await Promise.all(fontList.map(font => getFont(font, range)))
  return combine(fonts)
}

async function getFont(font, range) {
  return fs.readFile(`fonts/${font}/${range}.pbf`)
}
