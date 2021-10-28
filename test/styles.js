const assert = require('assert')
const fs = require('fs')
const publicUrlStyle = require('./resources/public-url-style')
const FormData = require('form-data')
const config = require('config')

describe('Styles', () => {
  it('should be able to import json styles', async () => {
    let style

    const _id = (await global.ax.superadmin.post('/api/styles', publicUrlStyle)).data._id
    style = (await global.ax.superadmin.get(`/api/styles/${_id}.json`)).data
    assert.ok(style)

    try {
      await global.ax.superadmin.get(`/api/styles/${_id}/sprite.json`)
      assert.fail()
    } catch (error) {
      assert.equal(error.status, 404)
    }

    try {
      await global.ax.superadmin.get(`/api/styles/${_id}/sprite.png`)
      assert.fail()
    } catch (error) {
      assert.equal(error.status, 404)
    }

    await global.ax.superadmin.delete(`/api/styles/${_id}.json`)
    try {
      style = (await global.ax.superadmin.get(`/api/styles/${_id}.json`)).data
      assert.fail()
    } catch (error) {
      assert.equal(error.status, 404)
    }
  })

  it('should be able to import zipped open-map-tile style with sprite', async () => {
    const formData = new FormData()
    formData.append('style.zip', fs.createReadStream('./test/resources/styles/openmaptiles-maptiler-basic.zip'))
    formData.append('tileset', 'openmaptiles-world')

    const _id = (await global.ax.superadmin.post('/api/styles', formData, { headers: formData.getHeaders() })).data._id

    assert.ok(_id)
    const style = (await global.ax.superadmin.get(`/api/styles/${_id}.json`)).data
    assert.ok(style)
    assert.equal(style.sources.openmaptiles.url, config.publicUrl + '/api/tilesets/openmaptiles-world.json')
    assert.equal(style.glyphs, config.publicUrl + '/api/fonts/{fontstack}/{range}.pbf')
    assert.equal(style.sprite, config.publicUrl + `/api/styles/${_id}/sprite`)

    const spriteJson = await global.ax.superadmin.get(`/api/styles/${_id}/sprite.json`)
    assert.ok(spriteJson.data)
    assert.equal(spriteJson.headers['content-type'], 'application/json; charset=utf-8')

    const spritePng = await global.ax.superadmin.get(`/api/styles/${_id}/sprite.png`)
    assert.ok(spritePng)
    assert.equal(spritePng.headers['content-type'], 'image/png; charset=utf-8')
  })
})
