const { promisify } = require('util')
const sqlite = require('sqlite3')

module.exports = (filename, options = sqlite.OPEN_READONLY) => new Promise((resolve, reject) => {
  const sql = new sqlite.Database(filename, options, (err) => {
    if (err) return reject(err)
    resolve({
      get: promisify(sql.get.bind(sql)),
      all: promisify(sql.all.bind(sql)),
      close: promisify(sql.close.bind(sql)),
    })
  })
})
module.exports.OPEN_READONLY = sqlite.OPEN_READONLY
