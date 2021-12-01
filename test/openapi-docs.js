const SwaggerParser = require('@apidevtools/swagger-parser')

describe('Openapi docs', () => {
  it('Should validate the generated openapi-docs.json', async () => {
    const docs = (await global.ax.superadmin.get('/api/api-docs.json')).data
    await SwaggerParser.validate(docs)
  })
})
