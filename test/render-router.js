const eventToPromise = require('event-to-promise')
const assert = require('assert')
const wkx = require('wkx')

describe('Render routes mapOptions', () => {
  it('Should get mapOptions from lon,lat and zoom query parameters', async () => {
    const style = (await global.ax.superadmin.post('/api/styles', { version: 8, sources: {}, layers: [] })).data
    const promise = eventToPromise(global.app.renderer.events, 'render')
    await global.ax.superadmin.get('/api/render/' + style._id + '/200x200.png?lon=1&lat=2&zoom=3')
    const { mapOptions } = await promise
    assert.equal(mapOptions.center[0], 1)
    assert.equal(mapOptions.center[1], 2)
    assert.equal(mapOptions.zoom, 3)
  })

  it('Should get mapOptions from bbox and padding query parameters', async () => {
    const style = (await global.ax.superadmin.post('/api/styles', { version: 8, sources: {}, layers: [] })).data
    let promise, mapOptions
    promise = eventToPromise(global.app.renderer.events, 'render')
    await global.ax.superadmin.get('/api/render/' + style._id + '/200x200.png?bbox=-2.674666,46.21875,0.918996,48.57002')
    mapOptions = (await promise).mapOptions
    assert.equal(mapOptions.center[0], -0.8778350000000001)
    assert.equal(mapOptions.center[1], 47.394385)
    assert.equal(mapOptions.zoom, 5.027220146021975)

    promise = eventToPromise(global.app.renderer.events, 'render')
    await global.ax.superadmin.get('/api/render/' + style._id + '/200x200.png?bbox=-2.674666,46.21875,0.918996,48.57002&padding=0.5')
    mapOptions = (await promise).mapOptions
    assert.equal(mapOptions.center[0], -0.8778350000000001)
    assert.equal(mapOptions.center[1], 47.394385)
    assert.equal(mapOptions.zoom, 4.290254551855771)
  })

  it('Should get mapOptions from geojson in query parameters', async () => {
    const style = (await global.ax.superadmin.post('/api/styles', { version: 8, sources: {}, layers: [] })).data
    const geojson = {
      type: 'MultiPoint',
      coordinates: [[0, 0], [1, 1]],
    }
    const wkb = wkx.Geometry.parseGeoJSON(geojson).toWkb().toString('base64url')
    const promise = eventToPromise(global.app.renderer.events, 'render')
    await global.ax.superadmin.get('/api/render/' + style._id + '/200x200.png?wkb-type=line&wkb=' + wkb)
    const { mapOptions, context } = await promise
    assert.equal(mapOptions.center[0], 0.5)
    assert.equal(mapOptions.center[1], 0.5)
    assert.equal(mapOptions.zoom, 6.872601626926404)
    assert.deepEqual(context.additionalSources.wkb.data, geojson)
  })

  it('Should get mapOptions from geojson in body', async () => {
    const style = (await global.ax.superadmin.post('/api/styles', { version: 8, sources: {}, layers: [] })).data
    const body = {
      sources: {
        geojson: {
          type: 'geojson',
          data: {
            type: 'MultiPoint',
            coordinates: [[0, 0], [1, 1]],
          },
        },
      },
    }
    const promise = eventToPromise(global.app.renderer.events, 'render')
    await global.ax.superadmin.post('/api/render/' + style._id + '/200x200.png', body)
    const { mapOptions, context } = await promise
    assert.equal(mapOptions.center[0], 0.5)
    assert.equal(mapOptions.center[1], 0.5)
    assert.equal(mapOptions.zoom, 6.872601626926404)
    assert.deepEqual(context.additionalSources.geojson, body.sources.geojson)
  })

  it('Should get mapOptions from multiple geojson in body', async () => {
    const style = (await global.ax.superadmin.post('/api/styles', { version: 8, sources: {}, layers: [] })).data
    const body = {
      sources: {
        geojson: {
          type: 'geojson',
          data: {
            type: 'MultiPoint',
            coordinates: [[0, 0], [1, 1]],
          },
        },
        geojson2: {
          type: 'geojson',
          data: {
            type: 'MultiPoint',
            coordinates: [[2, 2], [1, 1]],
          },
        },
      },
    }
    const promise = eventToPromise(global.app.renderer.events, 'render')
    await global.ax.superadmin.post('/api/render/' + style._id + '/200x200.png', body)
    const { mapOptions, context } = await promise
    assert.equal(mapOptions.center[0], 1)
    assert.equal(mapOptions.center[1], 1)
    assert.equal(mapOptions.zoom, 5.8723818428626515)
    assert.deepEqual(context.additionalSources.geojson, body.sources.geojson)
    assert.deepEqual(context.additionalSources.geojson2, body.sources.geojson2)
  })

  it('Should respond with statusCode 400 if there is nothing to center on', async () => {
    const style = (await global.ax.superadmin.post('/api/styles', { version: 8, sources: {}, layers: [] })).data
    try {
      await global.ax.superadmin.get('/api/render/' + style._id + '/200x200.png')
      assert.fail()
    } catch (error) {
      assert.equal(error.status, 400)
    }
  })
})
