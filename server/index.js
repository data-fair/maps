
async function start() {
  const db = await require('./mongodb').start()
  const renderer = await require('./renderer').start({ db })
  await require('./http').start({ db, renderer })
}

async function stop() {
  await require('./http').stop()
  await require('./renderer').stop()
  await require('./mongodb').stop()
}

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
