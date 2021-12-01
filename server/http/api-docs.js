module.exports = {
  openapi: '3.0.3',
  info: Object.assign({
    title: 'data-fair/maps',
    version: require('../../package.json').version,
  }, require('config').info),
  components: {
    parameters: {},
  },
  paths: {
    '/api-docs.json': {
      get: {
        // tags: [],
        // summary: '',
        // description: '',
        // parameters: [],
        // requestBody: {},
        responses: {
          200: {
            description: 'This documentation',
            content: {
              'application/json': {},
            },
          },
        },
      },
    },
  },
}
