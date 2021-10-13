const { createPool } = require('generic-pool')

module.exports = {
  createPool: (factory, options) => {
    const pool = createPool(factory, options)
    const use = pool.use.bind(pool)

    pool.use = async function(callback) {
      return await use(async (resource) => {
        const ret = await callback(resource)
        await factory.clean(resource)
        return ret
      })
    }

    return pool
  },
}
