const fs = require('fs');

(async () => {
  const filename = process.argv[2]
  const _id = process.argv[3]
  const tileset = process.argv[4]

  const fileBuffer = fs.readFileSync(filename)

  const db = await require('../server/mongodb').start()
  await require('../server/utils/import-zipped-style')(db, fileBuffer, _id, tileset)
  process.exit()
})()
