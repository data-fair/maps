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
app.use(require('body-parser').json()) // { limit: '1gb' }
// app.use(require('body-parser').)
app.use(require('body-parser').raw({ type: 'application/octet-stream', limit: '10gb' }))
app.use(require('./middlewares/public-url'))
app.use(sd.auth)
// app.use()

app.use('/api/tilesets', require('./routers/tilesets'))

app.use('/api/fonts', require('./routers/fonts'))
app.use('/api/styles', require('./routers/styles'))
// app.use('/api/rendered-tiles', require('./routers/rendered-tiles'))
app.use('/api/render', require('./routers/render'))

app.get('/api/api-docs.json', (req, res, next) => {
  const docs = JSON.parse(JSON.stringify(require('./api-docs')))
  docs.servers = [{ url: req.publicBaseUrl + '/api' }]
  res.send(docs)
})

app.use('/api', function (req, res, next) {
  if (!res.headersSent) return res.status(404).send()
})

app.use('/api', function (err, req, res, next) {
  if (err) {
    console.error(err.stack)
    return res.status(500).send(err.message)
  }
})

const server = require('http').createServer(app)
if (process.env.NODE_ENV === 'development') require('killable')(server)

module.exports.start = async ({ db, renderer }) => {
  app.use(await nuxt())
  app.set('db', db)
  app.set('renderer', renderer)
  server.listen(config.port)
  await eventToPromise(server, 'listening')
  console.log(`http server listening on ${config.publicUrl}`)
}

module.exports.stop = async () => {
  if (process.env.NODE_ENV === 'development') server.kill()
  else server.close()
  await eventToPromise(server, 'close')
}
