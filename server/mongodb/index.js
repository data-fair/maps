
const config = require('config')
const ensureIndexes = require('./ensure-indexes')
const { MongoClient } = require('mongodb')
const ensureSharding = require('./ensure-sharding')
const lock = require('./lock')

let client

module.exports.start = async () => {
  const opts = {
    useUnifiedTopology: true,
  }

  client = await MongoClient.connect(config.mongoUrl, opts)

  const db = client.db()
  await ensureIndexes(db)
  await lock.start(db)
  await ensureSharding(db)

  // if (process.env.NODE_ENV === 'development') await db.collection('styles').replaceOne({ _id: 'default' }, { ...require('../../public/assets/style'), _id: 'default' }, { upsert: true })
  return db
}

module.exports.stop = async () => {
  lock.stop()
  await client.close()
}
