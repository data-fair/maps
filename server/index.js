const { start, stop } = require('./app')

start().catch((err) => {
  console.error('Failure', err)
  process.exit(-1)
}).then(() =>
  console.log('Service started'),
)

process.on('SIGTERM', () => {
  stop().then(() => {
    console.log('shutting down now')
    process.exit()
  }).catch((err) => {
    console.error('Failure while stopping service', err)
    process.exit(-1)
  })
})
