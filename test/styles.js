const assert = require('assert')
const publicUrlStyle = require('./resources/public-url-style')

describe('styles', () => {
  it('should replace public urls inside style.json for multi domain support', async () => {
    let _id
    let style
    _id = (await global.ax.superadmin.post('/styles', publicUrlStyle)).data._id
    style = (await global.ax.superadmin.get(`/styles/${_id}.json`)).data

    assert.equal(style.sources.domain1Source.url, publicUrlStyle.sources.domain1Source.url)
    assert.equal(style.sources.domain2Source.url, publicUrlStyle.sources.domain2Source.url)
    assert.equal(style.sources.externalSource.url, publicUrlStyle.sources.externalSource.url)

    style = (await global.ax.tomban.get(`/styles/${_id}.json`)).data

    assert.equal(style.sources.domain1Source.url, publicUrlStyle.sources.domain2Source.url)
    assert.equal(style.sources.domain2Source.url, publicUrlStyle.sources.domain2Source.url)
    assert.equal(style.sources.externalSource.url, publicUrlStyle.sources.externalSource.url)

    _id = (await global.ax.tomban.post('/styles', publicUrlStyle)).data._id
    style = (await global.ax.tomban.get(`/styles/${_id}.json`)).data

    assert.equal(style.sources.domain1Source.url, publicUrlStyle.sources.domain1Source.url)
    assert.equal(style.sources.domain2Source.url, publicUrlStyle.sources.domain2Source.url)
    assert.equal(style.sources.externalSource.url, publicUrlStyle.sources.externalSource.url)

    style = (await global.ax.superadmin.get(`/styles/${_id}.json`)).data

    assert.equal(style.sources.domain1Source.url, publicUrlStyle.sources.domain1Source.url)
    assert.equal(style.sources.domain2Source.url, publicUrlStyle.sources.domain1Source.url)
    assert.equal(style.sources.externalSource.url, publicUrlStyle.sources.externalSource.url)
  })
})
