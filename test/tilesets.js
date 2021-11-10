const assert = require('assert')
const eventToPromise = require('event-to-promise')
const FormData = require('form-data')
const fs = require('fs')

describe('Tilesets', () => {
  it('Should import a tileset from a mbtiles', async () => {
    const formData = new FormData()
    formData.append('tileset.mbtiles', fs.createReadStream('./test/resources/mbtiles/zoom0.mbtiles'))
    let tileset = (await global.ax.superadmin.post('/api/tilesets', formData, { headers: formData.getHeaders() })).data

    assert.ok(tileset)
    assert.ok(tileset._id)
    assert.equal(tileset.tileCount, 0)

    await eventToPromise(global.app.workers.importMBTiles.events, `imported:${tileset._id}`)
    tileset = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}.json`)).data
    assert.equal(tileset.tileCount, 1)

    const tile = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/tiles/0/0/0.pbf`))
    assert.ok(tile)
  })
  it('Should import a tileset with _id as superAdmin from a mbtiles', async () => {
    const _id = 'test-put-tileset'
    const formData = new FormData()
    formData.append('tileset.mbtiles', fs.createReadStream('./test/resources/mbtiles/zoom0.mbtiles'))
    let tileset = (await global.ax.superadmin.put('/api/tilesets/' + _id, formData, { headers: formData.getHeaders() })).data

    assert.ok(tileset)
    assert.ok(tileset._id)
    assert.equal(tileset.tileCount, 0)

    await eventToPromise(global.app.workers.importMBTiles.events, `imported:${tileset._id}`)
    tileset = (await global.ax.superadmin.get(`/api/tilesets/${_id}.json`)).data
    assert.equal(tileset.tileCount, 1)

    const tile = (await global.ax.superadmin.get(`/api/tilesets/${_id}/tiles/0/0/0.pbf`))
    assert.ok(tile)
  })
  it('Should patch tileset with mbtiles diff', async () => {
    const formData0 = new FormData()
    formData0.append('tileset.mbtiles', fs.createReadStream('./test/resources/mbtiles/zoom0.mbtiles'))
    const formData1 = new FormData()
    formData1.append('tileset.mbtiles', fs.createReadStream('./test/resources/mbtiles/zoom1.mbtiles'))

    let tileset = (await global.ax.superadmin.post('/api/tilesets', formData0, { headers: formData0.getHeaders() })).data
    await eventToPromise(global.app.workers.importMBTiles.events, `imported:${tileset._id}`)
    tileset = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}.json`)).data
    assert.equal(tileset.tileCount, 1)
    assert.equal(tileset.minzoom, 0)
    assert.equal(tileset.maxzoom, 0)
    assert.ok(await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/tiles/0/0/0.pbf`))
    await assert.rejects(global.ax.superadmin.get(`/api/tilesets/${tileset._id}/tiles/1/0/0.pbf`))

    await global.ax.superadmin.patch('/api/tilesets/' + tileset._id, formData1, { headers: formData1.getHeaders() })
    await eventToPromise(global.app.workers.importMBTiles.events, `imported:${tileset._id}`)
    tileset = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}.json`)).data
    assert.equal(tileset.tileCount, 3)
    assert.equal(tileset.minzoom, 0)
    assert.equal(tileset.maxzoom, 1)
    assert.ok(await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/tiles/0/0/0.pbf`))
    assert.ok(await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/tiles/1/0/0.pbf`))
  })
  it('Should delete tileset and tiles', async () => {
    const formData = new FormData()
    formData.append('tileset.mbtiles', fs.createReadStream('./test/resources/mbtiles/zoom0.mbtiles'))
    let tileset = (await global.ax.superadmin.post('/api/tilesets', formData, { headers: formData.getHeaders() })).data
    await eventToPromise(global.app.workers.importMBTiles.events, `imported:${tileset._id}`)
    tileset = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}.json`)).data
    assert.equal(tileset.tileCount, 1)

    await global.ax.superadmin.delete('/api/tilesets/' + tileset._id)
    await assert.rejects(global.ax.superadmin.get(`/api/tilesets/${tileset._id}.json`))

    await eventToPromise(global.app.workers.deleteTileset.events, `deleted:${tileset._id}`)
    const tiles = await global.app.db.collection('tiles').find({ ts: tileset._id }).toArray()
    assert.equal(tiles.length, 0)
  })
})
