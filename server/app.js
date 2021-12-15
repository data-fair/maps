const config = require('config')

module.exports = {
  start: async function () {
    if (config.prometheus) await require('./prometheus').start()

    const stack = {}
    stack.db = await require('./mongodb').start()
    if (config.http?.enabled) stack.renderer = await require('./renderer').start(stack)

    if (config.worker?.enabled) stack.workers = await require('./workers').start(stack)
    if (config.http?.enabled) stack.http = await require('./http').start(stack)

    return stack
  },
  stop: async function () {
    if (config.http?.enabled) await require('./http').stop()
    if (config.worker?.enabled) await require('./workers').stop()

    if (config.http?.enabled) await require('./renderer').stop()
    await require('./mongodb').stop()

    if (config.prometheus) await require('./prometheus').stop()
  },
}
