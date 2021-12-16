const { executeGenerateTask } = require('../server/workers/generate-mbtiles')

;(async () => {
  try {
    const db = await require('../server/mongodb').start()
    const generateTask = {
      status: 'working',
      type: 'generate-mbtiles',
      tileset: process.argv[2],
      area: process.argv[3],
    }
    generateTask._id = (await db.collection('task').insertOne(generateTask)).insertedId
    console.log(generateTask)
    await executeGenerateTask(db, generateTask)
    await require('../server/mongodb').stop()
    process.exit()
  } catch (error) {
    console.error(error)
    process.exit(-1)
  }
})()
