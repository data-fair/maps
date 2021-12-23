const lock = require('./lock')

module.exports = async (db) => {
  try {
    await db.command({ isdbgrid: 1 })
  } catch (error) {
    if (error.codeName === 'CommandNotFound') return
    else throw error
  }

  try {
    await lock.acquire(db, 'sharding')
  } catch (error) {
    return
  }
  await db.admin().command({ enableSharding: db.namespace })
  await Promise.all([
    db.admin.command({ shardCollection: db.collection('tiles').namespace, key: { ts: 1, z: 1, x: 1, y: 1 } }),
  ])
  await lock.release(db, 'sharding')
}
