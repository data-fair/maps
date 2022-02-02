const assert = require('assert')
// const eventToPromise = require('event-to-promise')
const { postMBTiles } = require('./utils/import-mbtiles')
const points = [
  [-2.4296131877192995, 47.32006795101543], // 1 feature: #landuse { class: 'residential' }
  [-2.448908857273525, 47.30914711877363], // 1 feature: #park { class: 'site_ramsar',name: 'Marais salants de Guérande' }
  [-2.483328704463426, 47.29815411535077], // 2 features: #park { class: 'site_ramsar',name: 'Marais salants de Guérande' } #water { class: 'ocean' }
]
describe('Tilesets features routes', () => {
  it('Should get feature properties of multiple points', async () => {
    const tileset = await postMBTiles('./test/resources/mbtiles/france-pays-de-la-loire-8-126-89.mbtiles')
    const features = (await global.ax.superadmin.post(`/api/tilesets/${tileset._id}/features/properties_bulk`, points)).data
    assert.ok(features)
    assert.ok(features[0])
    assert.ok(features[1])
    assert.ok(features[2])
  })
  it('Should get feature properties of multiple points on a single layer', async () => {
    const tileset = await postMBTiles('./test/resources/mbtiles/france-pays-de-la-loire-8-126-89.mbtiles')
    let features = (await global.ax.superadmin.post(`/api/tilesets/${tileset._id}/features/properties_bulk?layer=water`, points)).data
    assert.ok(features)
    assert.ok(!features[0])
    assert.ok(!features[1])
    assert.equal(features[2]?.class, 'ocean')

    features = (await global.ax.superadmin.post(`/api/tilesets/${tileset._id}/features/properties_bulk?layer=park`, points)).data
    assert.ok(features)
    assert.ok(!features[0])
    assert.equal(features[2]?.class, 'site_ramsar')
    assert.equal(features[2]?.class, 'site_ramsar')

    features = (await global.ax.superadmin.post(`/api/tilesets/${tileset._id}/features/properties_bulk?layer=landuse`, points)).data
    assert.ok(features)
    assert.equal(features[0]?.class, 'residential')
    assert.ok(!features[1])
    assert.ok(!features[2])
  })
})
