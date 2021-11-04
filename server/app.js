
module.exports = {
  start: async function () {
    const db = await require('./mongodb').start()
    const renderer = await require('./renderer').start({ db })
    const workers = await require('./workers').start({ db, renderer })
    await require('./http').start({ db, renderer, workers })
    return { db, renderer, workers }
  },
  stop: async function () {
    await require('./http').stop()
    await require('./workers').stop()
    await require('./renderer').stop()
    await require('./mongodb').stop()
  },
}
