const { combine } = require('@mapbox/glyph-pbf-composite')
const fs = require('fs/promises')
const path = require('path')
const config = require('config')

module.exports = { getFonts, getFontsList }

async function getFonts(fontStack, range) {
  const fontList = fontStack.split(',')
  const fonts = await Promise.all(fontList.map(font => getFont(font, range)))
  return combine(fonts)
}

async function getFont(font, range) {
  return await fs.readFile(path.join(config.fontsPath, `./${font}/${range}.pbf`))
}

async function getFontsList() {
  return await fs.readdir(config.fontsPath)
}
