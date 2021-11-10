
const events = new (require('events').EventEmitter)()

const timeout = process.env.NODE_ENV === 'test' ? 100 : 5000

let stopped = false

const loop = async({ db }) => {
  // eslint-disable-next-line no-unmodified-loop-condition
  while (!stopped) {
    let deleteTask = await db.collection('task').findOne({ type: 'delete-tileset', status: 'pending' })
    if (!deleteTask) { await new Promise(resolve => setTimeout(resolve, timeout)); continue }
    deleteTask = (await db.collection('task').findOneAndUpdate({ _id: deleteTask._id, type: 'delete-tileset', status: 'pending' }, { $set: { status: 'working' } }, { returnNewDocument: true })).value
    if (!deleteTask) continue
    try {
      const ts = deleteTask.tileset
      // eslint-disable-next-line no-unmodified-loop-condition
      await db.collection('tiles').deleteMany({ ts })
      await db.collection('task').deleteOne({ _id: deleteTask._id, type: 'delete-tileset', status: 'working' })
      events.emit(`deleted:${ts}`)
    } catch (error) {
      console.error(error)
      await db.collection('task').updateOne({ _id: deleteTask._id, type: 'delete-tileset', status: 'working' }, { $set: { status: 'error', error } })
    }
  }
}

const pool = []
module.exports.start = async ({ db }) => {
  for (let i = 0; i < 4; i++) pool.push(loop({ db }))
  return { events }
}

module.exports.stop = async () => {
  stopped = true
  await Promise.all(pool)
}
