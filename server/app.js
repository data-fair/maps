
module.exports = {
  start: async function () {
    const db = await require('./mongodb').start()
    const renderer = await require('./renderer').start({ db })
    await require('./http').start({ db, renderer })
    return { db, renderer }
  },
  stop: async function () {
    await require('./http').stop()
    await require('./renderer').stop()
    await require('./mongodb').stop()
  },
}
