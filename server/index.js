const { start, stop } = require('./app')

const startPromise = start().catch((err) => {
  console.error('Failure', err)
  process.exit(-1)
}).then(() =>
  console.log('Service started'),
)

let stopPromise

process.on('SIGTERM', () => {
  if (stopPromise) return
  console.log('Shutting down')

  stopPromise = startPromise.then(() => {
    stop().then(() => {
      console.log('Shutting down now')
      process.exit()
    }).catch((err) => {
      console.error('Failure while stopping service', err)
      process.exit(-1)
    })
  })
})
