module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'data-fair/maps',
    // description: '',
    // termsOfService: '',
    // contact: {
    //   name: '',
    //   url: '',
    //   email: '',
    // },
    // license: {
    //   name: '',
    //   url: '',
    // },
    version: require('../../package.json').version,
  },
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
