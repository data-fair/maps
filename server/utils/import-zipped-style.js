const debug = require('debug')('import-zipped-style')
const Zip = require('node-zip')

module.exports = async(db, zippedBuffer, _id, openmaptilesTileset) => {
  debug('starting importation of: ' + _id)
  const mongoDocument = { _id }
  const { files } = new Zip(zippedBuffer, { base64: false, checkCRC: true })

  if (!files['style-local.json']) throw new Error()

  mongoDocument.style = JSON.parse(Buffer.from(files['style-local.json']._data.getContent()))
  mongoDocument.style.sources.openmaptiles.url = `maps://api/tilesets/${openmaptilesTileset}.json`
  mongoDocument.style.glyphs = 'maps://api/fonts/{fontstack}/{range}.pbf'

  if ((!files['sprite.json'] || !files['sprite.png']) && mongoDocument.style.sprite) throw new Error()
  if (mongoDocument.style.sprite) {
    mongoDocument.style.sprite = `maps://api/styles/${_id}/sprite`
    mongoDocument.sprite_json = JSON.parse(Buffer.from(files['sprite.json']._data.getContent()))
    mongoDocument.sprite_png = Buffer.from(files['sprite.png']._data.getContent())
  }
  await db.collection('styles').replaceOne({ _id }, mongoDocument, { upsert: true })
  debug('ending importation of: ' + _id)
  return mongoDocument
}
