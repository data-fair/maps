const assert = require('assert')
const config = require('config')
const fs = require('fs')
const FormData = require('form-data')

describe('Multi-domain support', () => {
  it('Should replace public urls inside style.json for multi domain support', async () => {
    const publicUrlStyle = require('./resources/public-url-style')
    let _id
    let style
    _id = (await global.ax.superadmin.post('/api/styles', publicUrlStyle)).data._id
    style = (await global.ax.superadmin.get(`/api/styles/${_id}.json`)).data

    assert.equal(style.sources.domain1Source.url, publicUrlStyle.sources.domain1Source.url)
    assert.equal(style.sources.domain2Source.url, publicUrlStyle.sources.domain2Source.url)
    assert.equal(style.sources.externalSource.url, publicUrlStyle.sources.externalSource.url)

    style = (await global.ax.tomban.get(`/api/styles/${_id}.json`)).data

    assert.equal(style.sources.domain1Source.url, publicUrlStyle.sources.domain2Source.url)
    assert.equal(style.sources.domain2Source.url, publicUrlStyle.sources.domain2Source.url)
    assert.equal(style.sources.externalSource.url, publicUrlStyle.sources.externalSource.url)

    _id = (await global.ax.tomban.post('/api/styles', publicUrlStyle)).data._id
    style = (await global.ax.tomban.get(`/api/styles/${_id}.json`)).data

    assert.equal(style.sources.domain1Source.url, publicUrlStyle.sources.domain1Source.url)
    assert.equal(style.sources.domain2Source.url, publicUrlStyle.sources.domain2Source.url)
    assert.equal(style.sources.externalSource.url, publicUrlStyle.sources.externalSource.url)

    style = (await global.ax.superadmin.get(`/api/styles/${_id}.json`)).data

    assert.equal(style.sources.domain1Source.url, publicUrlStyle.sources.domain1Source.url)
    assert.equal(style.sources.domain2Source.url, publicUrlStyle.sources.domain1Source.url)
    assert.equal(style.sources.externalSource.url, publicUrlStyle.sources.externalSource.url)
  })
  it('Should replace public urls inside tile.json for multi domain support', async () => {
    let formData
    let _id
    let tilejson

    formData = new FormData()
    formData.append('tileset.mbtiles', fs.createReadStream('./test/resources/mbtiles/zoom0.mbtiles'))
    _id = (await global.ax.superadmin.post('/api/tilesets', formData, { headers: formData.getHeaders() })).data._id
    tilejson = (await global.ax.superadmin.get(`/api/tilesets/${_id}.json`)).data
    assert.equal(tilejson.tiles[0], config.publicUrl + `/api/tilesets/${_id}/tiles/{z}/{x}/{y}.pbf`)

    tilejson = (await global.ax.tomban.get(`/api/tilesets/${_id}.json`)).data
    assert.equal(tilejson.tiles[0], config.publicUrl2 + `/api/tilesets/${_id}/tiles/{z}/{x}/{y}.pbf`)

    formData = new FormData()
    formData.append('tileset.mbtiles', fs.createReadStream('./test/resources/mbtiles/zoom0.mbtiles'))
    _id = (await global.ax.tomban.post('/api/tilesets', formData, { headers: formData.getHeaders() })).data._id
    tilejson = (await global.ax.tomban.get(`/api/tilesets/${_id}.json`)).data
    assert.equal(tilejson.tiles[0], config.publicUrl2 + `/api/tilesets/${_id}/tiles/{z}/{x}/{y}.pbf`)

    tilejson = (await global.ax.superadmin.get(`/api/tilesets/${_id}.json`)).data
    assert.equal(tilejson.tiles[0], config.publicUrl + `/api/tilesets/${_id}/tiles/{z}/{x}/{y}.pbf`)
  })
})
