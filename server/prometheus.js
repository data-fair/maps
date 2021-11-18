const express = require('express')
const eventToPromise = require('event-to-promise')
const client = require('prom-client')

const app = express()
const server = require('http').createServer(app)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType)
  res.send(await client.register.metrics())
})
exports.client = client
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

exports.maplibre_render_timer = new client.Histogram({
  name: 'maplibre_render_timer',
  help: 'Timers of maplibre render calls',
  labelNames: ['reuse'],
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.75, 1, 2, 4, 10, 30, 60],
})
