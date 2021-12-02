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
  it('Should merge tiles', async () => {
    let formData

    formData = new FormData()
    formData.append('tileset.mbtiles', fs.createReadStream('./test/resources/mbtiles/france-pays-de-la-loire-8-126-89.mbtiles'))
    formData.append('area', 'pays-de-la-loire')
    const paysDeLaLoire = (await global.ax.superadmin.put('/api/tilesets/pays-de-la-loire', formData, { headers: formData.getHeaders() })).data
    await eventToPromise(global.app.workers.importMBTiles.events, `imported:${paysDeLaLoire._id}`)
    const tilePaysDeLaLoire = (await global.ax.superadmin.get(`/api/tilesets/${paysDeLaLoire._id}/tiles/8/126/89.geojson`)).data
    assert.ok(tilePaysDeLaLoire)

    formData = new FormData()
    formData.append('tileset.mbtiles', fs.createReadStream('./test/resources/mbtiles/france-bretagne-8-126-89.mbtiles'))
    formData.append('area', 'bretagne')
    const bretagne = (await global.ax.superadmin.put('/api/tilesets/bretagne', formData, { headers: formData.getHeaders() })).data
    await eventToPromise(global.app.workers.importMBTiles.events, `imported:${bretagne._id}`)
    const tileBretagne = (await global.ax.superadmin.get(`/api/tilesets/${bretagne._id}/tiles/8/126/89.geojson`)).data
    assert.ok(tileBretagne)

    formData = new FormData()
    formData.append('tileset.mbtiles', fs.createReadStream('./test/resources/mbtiles/france-pays-de-la-loire-8-126-89.mbtiles'))
    formData.append('area', 'pays-de-la-loire')
    const france = (await global.ax.superadmin.put('/api/tilesets/france', formData, { headers: formData.getHeaders() })).data
    await eventToPromise(global.app.workers.importMBTiles.events, `imported:${france._id}`)

    formData = new FormData()
    formData.append('tileset.mbtiles', fs.createReadStream('./test/resources/mbtiles/france-bretagne-8-126-89.mbtiles'))
    formData.append('area', 'bretagne')
    const francePatch = (await global.ax.superadmin.patch(`/api/tilesets/${france._id}`, formData, { headers: formData.getHeaders() })).data
    await eventToPromise(global.app.workers.importMBTiles.events, `imported:${francePatch._id}`)
    const tileFrance = (await global.ax.superadmin.get(`/api/tilesets/${france._id}/tiles/8/126/89.geojson`)).data
    assert.ok(tileFrance)

    assert.ok(tileFrance.features.length > tilePaysDeLaLoire.features.length)
    assert.ok(tileFrance.features.length > tileBretagne.features.length)

    tilePaysDeLaLoire.features = tilePaysDeLaLoire.features.filter((f, i) => i % 2)
    assert.equal(tilePaysDeLaLoire.features.filter((feature, index) =>
       (tileFrance.features.find(f => JSON.stringify({ ...f.properties, area: '' }) === JSON.stringify({ ...feature.properties, area: '' }) &&
       JSON.stringify(f.geometry) === JSON.stringify(feature.geometry))),
    ).length, tilePaysDeLaLoire.features.length)

    tileBretagne.features = tileBretagne.features.filter((f, i) => i % 2)
    assert.equal(tileBretagne.features.filter((feature, index) =>
      (tileFrance.features.find(f => JSON.stringify({ ...f.properties, area: '' }) === JSON.stringify({ ...feature.properties, area: '' }) &&
      JSON.stringify(f.geometry) === JSON.stringify(feature.geometry))),
    ).length, tileBretagne.features.length)
  })
})
