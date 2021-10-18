const express = require('express')
const eventToPromise = require('event-to-promise')
const config = require('config')
const sd = require('@koumoul/sd-express')({ directoryUrl: config.directoryUrl, privateDirectoryUrl: config.privateDirectoryUrl })

const app = express()
const nuxt = require('./nuxt')

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  app.use(require('cors')())
  app.use(require('http-proxy-middleware').createProxyMiddleware('/simple-directory', { target: config.privateDirectoryUrl, pathRewrite: { '^/simple-directory': '' } }))
}

app.use(require('body-parser').json())
app.use(require('./middlewares/public-url'))
app.use(sd.auth)

app.use('/tiles', require('./routers/tiles'))
app.use('/fonts', require('./routers/fonts'))
app.use('/styles', require('./routers/styles'))
app.use('/rendered-tiles', require('./routers/rendered-tiles'))
app.use('/render', require('./routers/render'))

app.get('/api-docs.json', (req, res, next) => {
  const docs = JSON.parse(JSON.stringify(require('./api-docs')))
  docs.servers = [{ url: req.publicBaseUrl }]
  res.send(docs)
})

const server = require('http').createServer(app)
let server2

module.exports.start = async ({ db, renderer }) => {
  app.use(await nuxt())
  app.set('db', db)
  app.set('renderer', renderer)
  server.listen(config.port)
  await eventToPromise(server, 'listening')
  console.log(`http server listening on ${config.publicUrl}`)
  server2 = require('http').createServer(app)
  if ((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')) {
    server2.listen(config.port2)
    await eventToPromise(server2, 'listening')
    console.log(`http server listening on ${config.publicUrl2}`)
  }
}

module.exports.stop = async () => {
  server.close()
  await eventToPromise(server, 'closed')
  if (server2) {
    server2.close()
    await eventToPromise(server2, 'closed')
  }
}
