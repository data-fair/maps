module.exports = {
  http: {
    enabled: {
      __name: 'HTTP_ENABLED',
      __format: 'json',
    },
    tileMaxAge: 'TILE_MAX_AGE',
    // renderedTiles: 'HTTP_RENDERED_TILES',
  },
  workers: {
    enabled: {
      __name: 'WORKERS_ENABLED',
      __format: 'json',
    },
    importMBTiles: {
      enabled: {
        __name: 'WORKER_IMPORT_MBTILES_ENABLED',
        __format: 'json',
      },
      pool: 'WORKER_IMPORT_POOL',
      batchSize: 'WORKER_IMPORT_BATCHSIZE',
      sleepTime: 'WORKER_IMPORT_SLEEPTIME',
      lockTime: 'WORKER_IMPORT_LOCKTIME',
    },
    deleteTileset: {
      enabled: {
        __name: 'WORKER_DELETE_TILESET_ENABLED',
        __format: 'json',
      },
    },
  },

  port: 'PORT',
  publicUrl: 'PUBLIC_URL',
  directoryUrl: 'DIRECTORY_URL',
  privateDirectoryUrl: 'PRIVATE_DIRECTORY_URL',
  openapiViewerUrl: 'OPENAPI_VIEWER_URL',
  mongoUrl: 'MONGO_URL',
  maplibrePool: 'MAPLIBRE_POOL',
  imageSizeLimit: 'IMAGE_SIZE_LIMIT',
  fontsPath: 'FONTS_PATH',
  prometheus: 'PROMETHEUS',
  info: {
    termsOfService: 'INFO_TOS',
    contact: {
      __name: 'INFO_CONTACT',
      __format: 'json',
    },
  },
  brand: {
    logo: 'BRAND_LOGO',
    title: 'BRAND_TITLE',
    description: 'BRAND_DESCRIPTION',
    url: 'BRAND_URL',
    embed: 'BRAND_EMBED',
  },
  theme: {
    dark: {
      __name: 'THEME_DARK',
      __format: 'json',
    },
    colors: {
      primary: 'THEME_PRIMARY',
      secondary: 'THEME_SECONDARY',
      accent: 'THEME_ACCENT',
      error: 'THEME_ERROR',
      info: 'THEME_INFO',
      success: 'THEME_SUCCESS',
      warning: 'THEME_WARNING',
    },
    darkColors: {
      primary: 'THEME_DARK_PRIMARY',
      secondary: 'THEME_DARK_SECONDARY',
      accent: 'THEME_DARK_ACCENT',
      error: 'THEME_DARK_ERROR',
      info: 'THEME_DARK_INFO',
      success: 'THEME_DARK_SUCCESS',
      warning: 'THEME_DARK_WARNING',
    },
    cssUrl: 'THEME_CSS_URL',
    cssText: 'THEME_CSS_TEXT',
  },
  i18n: {
    locales: 'I18N_LOCALES',
    defaultLocale: 'I18N_DEFAULT_LOCALE',
  },
}
