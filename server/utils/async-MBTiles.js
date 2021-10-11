const MBTiles = require('@mapbox/mbtiles')
const { promisify } = require('util')

module.exports = (filename) => new Promise((resolve, reject) => {
  new MBTiles(filename, (err, mbtiles) => {
    if (err) return reject(err)

    const asyncMBTiles = {
      getInfo: promisify(mbtiles.getInfo.bind(mbtiles)),
      getTile: promisify((z, x, y, callback) => mbtiles.getTile(z, x, y, (err, data, headers) => callback(err, { data, headers }))),
    }

    resolve(asyncMBTiles)
  })
})

module.exports.list = promisify(MBTiles.list)
