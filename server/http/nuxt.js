const config = require('config')
const { Nuxt, Builder } = require('nuxt')

const nuxtConfig = require('../../nuxt.config.js')

module.exports = async () => {
  if (config.noUI) {
    // no UI during CI tests
    return (req, res, next) => next()
  } else if (process.env.NODE_ENV === 'development') {
    // in dev mode the nuxt dev server is already running, we re-expose it
    return require('http-proxy-middleware').createProxyMiddleware({ target: 'http://localhost:3000', logLevel: 'silent' })
  } else if (process.env.NODE_ENV === 'test') {
    // try to make this as fast as possible
    nuxtConfig.dev = true
    nuxtConfig.cache = true
    // nuxtConfig.hardSource = true
    nuxtConfig.build.html = { minify: { minifyJS: false } }
    // UI also during tests for reports testing
    const nuxt = new Nuxt(nuxtConfig)
    await new Builder(nuxt).build()
    return async (req, res, next) => {
      // re-apply the prefix that was removed by our reverse proxy in prod configs
      req.url = (nuxtConfig.router.base + req.url).replace('//', '/')
      nuxt.render(req, res)
    }
  } else {
    // Prepare nuxt for rendering and serving UI
    const nuxt = new Nuxt(nuxtConfig)
    return async (req, res, next) => {
      // re-apply the prefix that was removed by our reverse proxy in prod configs
      req.url = (nuxtConfig.router.base + req.url).replace('//', '/')
      nuxt.render(req, res)
    }
  }
}
