const assert = require('assert')
// const eventToPromise = require('event-to-promise')
const { postMBTiles } = require('./utils/import-mbtiles')
const wkx = require('wkx')

describe('Tilesets features routes', () => {
  const points = [
    [-2.4296131877192995, 47.32006795101543], // 1 feature: #landuse { class: 'residential' }
    [-2.448908857273525, 47.30914711877363], // 1 feature: #park { class: 'site_ramsar',name: 'Marais salants de Guérande' }
    [-2.483328704463426, 47.29815411535077], // 2 features: #park { class: 'site_ramsar',name: 'Marais salants de Guérande' } #water { class: 'ocean' }
  ]

  it('Should get features based on intersection', async () => {
    const tileset = await postMBTiles('./test/resources/mbtiles/france-pays-de-la-loire-8-126-89.mbtiles')
    let features = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/features`, {
      params: {
        'intersect-wkb': wkx.Geometry.parseGeoJSON({ type: 'Point', coordinates: points[0] }).toWkb().toString('base64url'),
        layer: 'landuse',
      },
    })).data.results
    assert.equal(features.length, 1)
    assert.equal(features[0].properties.class, 'residential')

    features = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/features`, {
      params: {
        'intersect-wkb': wkx.Geometry.parseGeoJSON({ type: 'Point', coordinates: points[0] }).toWkb().toString('base64url'),
        layer: 'park',
      },
    })).data.results
    assert.equal(features.length, 0)

    features = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}/features`, {
      params: {
        'intersect-wkb': wkx.Geometry.parseGeoJSON({ type: 'LineString', coordinates: [points[1], points[2]] }).toWkb().toString('base64url'),
        layer: 'park',
      },
    })).data.results
    assert.equal(features.length, 1)
  })

  /* it('Should get feature properties of multiple points', async () => {
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

  const polygons = [{
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        points,
      ],
    },
  }, {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-2.486600875854492, 47.309383428382155],
          [-2.498359680175781, 47.298732381222464],
          [-2.4866867065429688, 47.29244551035176],
          [-2.4722671508789062, 47.29104832642957],
          [-2.4573326110839844, 47.29553082741946],
          [-2.45819091796875, 47.30455289150632],
          [-2.468576431274414, 47.312409563914656],
          [-2.486600875854492, 47.309383428382155],
        ],
      ],
    },
  }]
  it('Should get feature properties of multiple polygons', async () => {
    const tileset = await postMBTiles('./test/resources/mbtiles/france-pays-de-la-loire-8-126-89.mbtiles')
    const features = (await global.ax.superadmin.post(`/api/tilesets/${tileset._id}/features/polygon_properties_bulk`, polygons)).data
    assert.ok(features)
    assert.equal(features.length, 2)
    assert.equal(features[0].length, 3)
    assert.equal(features[1].length, 2)
  })
  */
})
