
module.exports = {
  http: {
    enabled: true,
    tileMaxAge: 0,
  },
  workers: {
    enabled: true,
    importMBTiles: {
      enabled: true,
      pool: 4,
      sleepTime: 5000,
      batchSize: 100,
      lockTime: 10 * 60 * 1000,
    },
    deleteTileset: {
      enabled: true,
    },
  },

  port: 7400,
  publicUrl: 'http://localhost:7400',
  directoryUrl: 'http://localhost:7400/simple-directory',
  openapiViewerUrl: 'https://koumoul.com/openapi-viewer/',
  mongoUrl: 'mongodb://localhost:27017/data-fair-maps-' + (process.env.NODE_ENV || 'development'),
  maplibrePool: 10,
  imageSizeLimit: 1000 * 1000,
  fontsPath: '/fonts',
  prometheus: true,
  info: {
    termsOfService: 'https://koumoul.com/platform/term-of-service',
    contact: {
      name: 'Koumoul',
      url: 'https://koumoul.com',
      email: 'support@koumoul.com',
    },
  },
  brand: {
    logo: 'https://koumoul.com/static/logo-square.png',
    title: 'DataFair - Maps',
    description: 'Find, Access, Interoperate, Reuse data on the Web',
    url: null,
    embed: null,
  },
  theme: {
    dark: false,
    colors: {
      primary: '#1E88E5', // blue.darken1
      secondary: '#42A5F5', // blue.lighten1,
      accent: '#FF9800', // orange.base
      error: 'FF5252', // red.accent2
      info: '#2196F3', // blue.base
      success: '#4CAF50', // green.base
      warning: '#E91E63', // pink.base
      admin: '#E53935', // red.darken1
    },
    darkColors: {
      primary: '#2196F3', // blue.base
      success: '#00E676', // green.accent3
    },
    cssUrl: null,
    cssText: '',
  },
  i18n: {
    locales: 'fr,en',
    defaultLocale: 'fr',
  },
  // darkModeSwitch: true,
}
