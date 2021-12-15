const { executeGenerateTask } = require('../server/workers/generate-mbtiles')

;(async () => {
  try {
    const db = await require('../server/mongodb').start()
    await executeGenerateTask(db, { _id: process.argv[2] })
    await require('../server/mongodb').stop()
    process.exit()
  } catch (error) {
    console.error(error)
    process.exit(-1)
  }
})()
