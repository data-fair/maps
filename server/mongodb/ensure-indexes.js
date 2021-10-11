async function ensureIndex(db, collection, key, options = {}) {
  try {
    await db.collection(collection).createIndex(key, options)
  } catch (err) {
    if ((err.code !== 85 && err.code !== 86) || !options.name) throw err

    // if the error is a conflict on keys or params of the index we automatically
    // delete then recreate the index
    console.log(`Drop then recreate index ${collection}/${options.name}`)
    await db.collection(collection).dropIndex(options.name)
    await db.collection(collection).createIndex(key, options)
  }
}

module.exports = async (db) => {
  await Promise.all([
    ensureIndex(db, 'tiles', { tileset_id: 1, z: 1, x: 1, y: 1 }, { name: 'primary-keys', unique: true }),
  ])
}
