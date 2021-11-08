const express = require('express')
const eventToPromise = require('event-to-promise')
const client = require('prom-client')

const app = express()
const server = require('http').createServer(app)
app.get('/metrics', (req, res) => {
  res.set('Content-Type', client.register.contentType)
  res.send(client.register.metrics())
})
exports.start = async () => {
  server.listen(9090)
  await eventToPromise(server, 'listening')
  console.log('Prometheus metrics server listening on http://localhost:9090')
}
exports.stop = async () => {
  server.close()
  await eventToPromise(server, 'close')
}

exports.maplibre_pool_size = new client.Gauge({
  name: 'maplibre_pool_size',
  help: 'Current size of the maplibre pool',
})
