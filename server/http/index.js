const express = require('express')
const eventToPromise = require('event-to-promise')
const config = require('config')
const app = express()

const nuxt = require('./nuxt')

app.use('/', require('./middlewares/public-url'))

app.use('/tiles', require('./routers/tiles'))
// app.use('/fonts', require('./routers/fonts'))
app.use('/styles', require('./routers/styles'))
app.use('/rendered-tiles', require('./routers/rendered-tiles'))
// app.use('/render', require('./routers/render'))

const server = require('http').createServer(app)
module.exports.start = async ({ db, renderer }) => {
  app.use(await nuxt())
  app.set('db', db)
  app.set('renderer', renderer)
  server.listen(config.port)
  await eventToPromise(server, 'listening')
  console.log(`http server listening on ${config.publicUrl}`)
}

module.exports.stop = async () => {
  server.close()
  await eventToPromise(server, 'closed')
}
