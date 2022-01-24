const assert = require('assert')
const eventToPromise = require('event-to-promise')
const { postMBTiles, putMBTiles, patchTileset } = require('./utils/import-mbtiles')

describe('Tilesets', () => {
  it('Should create a tileset from a mbtiles', async () => {
    const tileset = await postMBTiles('./test/resources/mbtiles/zoom0.mbtiles')
    assert.ok(tileset)
    assert.ok(tileset._id)
    assert.equal(tileset.tileCount, 1)

    const tile = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/tiles/0/0/0.pbf`))
    assert.ok(tile)
  })

  it('Should create a tileset from a mbtiles and an _id ', async () => {
    const _id = 'test-put-tileset'
    const tileset = await putMBTiles('./test/resources/mbtiles/zoom0.mbtiles', _id)
    assert.ok(tileset)
    assert.ok(tileset._id)
    assert.equal(tileset._id, _id)
    assert.equal(tileset.tileCount, 1)
    const tile = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/tiles/0/0/0.pbf`))
    assert.ok(tile)
  })

  it('Should patch tileset with mbtiles diff', async () => {
    let tileset = await postMBTiles('./test/resources/mbtiles/zoom0.mbtiles')
    assert.equal(tileset.tileCount, 1)
    assert.equal(tileset.minzoom, 0)
    assert.equal(tileset.maxzoom, 0)
    assert.ok(await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/tiles/0/0/0.pbf`))
    assert.ok(!(await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/tiles/1/0/0.pbf`)).data)

    tileset = await patchTileset('./test/resources/mbtiles/zoom1.mbtiles', tileset._id)
    assert.equal(tileset.tileCount, 3)
    assert.equal(tileset.minzoom, 0)
    assert.equal(tileset.maxzoom, 1)
    assert.ok(await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/tiles/0/0/0.pbf`))
    assert.ok((await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/tiles/1/0/0.pbf`)).data)
  })

  it('Should delete tileset and tiles', async () => {
    const tileset = await postMBTiles('./test/resources/mbtiles/zoom0.mbtiles')
    assert.equal(tileset.tileCount, 1)

    await global.ax.superadmin.delete('/api/tilesets/' + tileset._id)
    await eventToPromise(global.app.workers.deleteTileset.events, `deleted:${tileset._id}`)
    await assert.rejects(global.ax.superadmin.get(`/api/tilesets/${tileset._id}.json`))

    const tiles = await global.app.db.collection('tiles').find({ ts: tileset._id }).toArray()
    assert.equal(tiles.length, 0)
  })

  it('Should merge tiles', async () => {
    const paysDeLaLoire = await postMBTiles('./test/resources/mbtiles/france-pays-de-la-loire-8-126-89.mbtiles', 'pays-de-la-loire')
    const tilePaysDeLaLoire = (await global.ax.superadmin.get(`/api/tilesets/${paysDeLaLoire._id}/tiles/8/126/89.geojson`)).data
    assert.ok(tilePaysDeLaLoire)

    const bretagne = await postMBTiles('./test/resources/mbtiles/france-bretagne-8-126-89.mbtiles', 'bretagne')
    const tileBretagne = (await global.ax.superadmin.get(`/api/tilesets/${bretagne._id}/tiles/8/126/89.geojson`)).data
    assert.ok(tileBretagne)

    const france = await postMBTiles('./test/resources/mbtiles/france-pays-de-la-loire-8-126-89.mbtiles', 'pays-de-la-loire')
    await patchTileset('./test/resources/mbtiles/france-bretagne-8-126-89.mbtiles', france._id, 'bretagne')
    const tileFrance = (await global.ax.superadmin.get(`/api/tilesets/${france._id}/tiles/8/126/89.geojson`)).data
    assert.ok(tileFrance)

    assert.ok(tileFrance.features.length > tilePaysDeLaLoire.features.length)
    assert.ok(tileFrance.features.length > tileBretagne.features.length)

    tilePaysDeLaLoire.features = tilePaysDeLaLoire.features.filter((f, i) => i % 2)
    assert.equal(tilePaysDeLaLoire.features.filter((feature) =>
       (tileFrance.features.find(f => JSON.stringify({ ...f.properties, area: '' }) === JSON.stringify({ ...feature.properties, area: '' }) &&
       JSON.stringify(f.geometry) === JSON.stringify(feature.geometry))),
    ).length, tilePaysDeLaLoire.features.length)

    tileBretagne.features = tileBretagne.features.filter((f, i) => i % 2)
    assert.equal(tileBretagne.features.filter((feature) =>
      (tileFrance.features.find(f => JSON.stringify({ ...f.properties, area: '' }) === JSON.stringify({ ...feature.properties, area: '' }) &&
      JSON.stringify(f.geometry) === JSON.stringify(feature.geometry))),
    ).length, tileBretagne.features.length)
  })

  it('Should generate a tileset preview', async() => {
    const tileset = await postMBTiles('./test/resources/mbtiles/zoom0.mbtiles')
    const preview = await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/preview/100x100.png`)
    assert.ok(preview)
  })
})
