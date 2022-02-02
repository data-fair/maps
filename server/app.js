const config = require('config')

module.exports = {
  start: async function () {
    if (config.prometheus) await require('./prometheus').start()

    const stack = {}
    stack.db = config.workers?.enabled ? await require('../upgrade')() : await require('./mongodb').start()
    if (config.http?.enabled) stack.renderer = await require('./renderer').start(stack)

    if (config.workers?.enabled) stack.workers = await require('./workers').start(stack)
    if (config.http?.enabled) stack.http = await require('./http').start(stack)

    return stack
  },
  stop: async function () {
    if (config.http?.enabled) await require('./http').stop()
    if (config.workers?.enabled) await require('./workers').stop()

    if (config.http?.enabled) await require('./renderer').stop()
    await require('./mongodb').stop()

    if (config.prometheus) await require('./prometheus').stop()
  },
}
