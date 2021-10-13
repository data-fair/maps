const express = require('express')
const eventToPromise = require('event-to-promise')
const config = require('config')
const sd = require('@koumoul/sd-express')({ directoryUrl: config.directoryUrl, privateDirectoryUrl: config.privateDirectoryUrl })

const app = express()
const nuxt = require('./nuxt')

if (process.env.NODE_ENV === 'development') {
  app.use('/simple-directory', require('http-proxy-middleware').createProxyMiddleware({ target: config.privateDirectoryUrl, pathRewrite: { '^/simple-directory': '' } }))
}

app.use(require('body-parser').json())
app.use(require('./middlewares/public-url'))
app.use(sd.auth)

app.use('/tiles', require('./routers/tiles'))
// app.use('/fonts', require('./routers/fonts'))
app.use('/styles', require('./routers/styles'))
app.use('/rendered-tiles', require('./routers/rendered-tiles'))
app.use('/render', require('./routers/render'))

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
