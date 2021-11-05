const assert = require('assert')
const eventToPromise = require('event-to-promise')
const fs = require('fs/promises')

describe('Tilesets', () => {
  it('Should import a tileset from a mbtiles', async () => {
    const buffer = await fs.readFile('./test/resources/mbtiles/zoom0.mbtiles')
    let tileset = (await global.ax.superadmin.post('/api/tilesets', buffer, { headers: { 'Content-type': 'application/octet-stream' } })).data

    assert.ok(tileset)
    assert.ok(tileset._id)
    assert.equal(tileset.tileCount, 0)

    await eventToPromise(global.app.workers.mbtilesImporter.events, `imported:${tileset._id}`)
    tileset = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}.json`)).data
    assert.equal(tileset.tileCount, 1)

    const tile = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/tiles/0/0/0.pbf`))
    assert.ok(tile)
  })
  it('Should import a tileset with _id as superAdmin from a mbtiles', async () => {
    const _id = 'test-put-tileset'
    const buffer = await fs.readFile('./test/resources/mbtiles/zoom0.mbtiles')
    let tileset = (await global.ax.superadmin.put('/api/tilesets/' + _id, buffer, { headers: { 'Content-type': 'application/octet-stream' } })).data

    assert.ok(tileset)
    assert.ok(tileset._id)
    assert.equal(tileset.tileCount, 0)

    await eventToPromise(global.app.workers.mbtilesImporter.events, `imported:${tileset._id}`)
    tileset = (await global.ax.superadmin.get(`/api/tilesets/${_id}.json`)).data
    assert.equal(tileset.tileCount, 1)

    const tile = (await global.ax.superadmin.get(`/api/tilesets/${_id}/tiles/0/0/0.pbf`))
    assert.ok(tile)
  })
  it('Should patch tileset with mbtiles diff', async () => {
    const zoom0 = await fs.readFile('./test/resources/mbtiles/zoom0.mbtiles')
    const zoom1 = await fs.readFile('./test/resources/mbtiles/zoom1.mbtiles')
    let tileset = (await global.ax.superadmin.post('/api/tilesets', zoom0, { headers: { 'Content-type': 'application/octet-stream' } })).data
    assert.ok(tileset)
    assert.ok(tileset._id)
    assert.equal(tileset.tileCount, 0)

    await eventToPromise(global.app.workers.mbtilesImporter.events, `imported:${tileset._id}`)
    tileset = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}.json`)).data
    assert.equal(tileset.tileCount, 1)

    await global.ax.superadmin.patch('/api/tilesets/' + tileset._id, zoom1, { headers: { 'Content-type': 'application/octet-stream' } })
    await eventToPromise(global.app.workers.mbtilesImporter.events, `imported:${tileset._id}`)

    tileset = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}.json`)).data
    assert.equal(tileset.tileCount, 3)
  })
})
