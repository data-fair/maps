const assert = require('assert')

describe('Router fonts', () => {
  it('Should list all available fonts', async () => {
    const { data: fonts } = await global.ax.superadmin.get('/api/fonts')
    assert.equal(fonts.length, 1)
    assert.equal(fonts[0], 'Roboto Regular')
  })
  it('Should get a font', async () => {
    const { data: fonts } = await global.ax.superadmin.get('/api/fonts/Roboto Regular/0-255.pbf')
    assert.ok(fonts)
  })
})
