const lock = require('./lock')

async function ensureSharding(db, collection, key) {
  try {
    await db.admin().command({ shardCollection: db.collection(collection).namespace, key })
  } catch (error) {
    if (error.codeName !== 'LockBusy') throw error
  }
}

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
    ensureSharding(db, 'tiles', { ts: 1, z: 1, x: 1, y: 1 }),
  ])
  await lock.release(db, 'sharding')
}
