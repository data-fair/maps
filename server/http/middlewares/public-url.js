const config = require('config')
const originalUrl = require('original-url')
const { format: formatUrl } = require('url')

let basePath = new URL(config.publicUrl).pathname
if (!basePath.endsWith('/')) basePath += '/'

module.exports = (req, res, next) => {
  const decomposedUrl = originalUrl(req)
  // console.log(decomposedUrl)
  const urlParts = { protocol: decomposedUrl.protocol, hostname: decomposedUrl.hostname, pathname: basePath.slice(0, -1) }
  if (decomposedUrl.port !== 443 && decomposedUrl.port !== 80) urlParts.port = decomposedUrl.port
  req.publicBaseUrl = decomposedUrl.full ? formatUrl(urlParts) : config.publicUrl
  // req.directoryUrl = decomposedUrl.full ? formatUrl({ ...urlParts, pathname: '/simple-directory' }) : config.directoryUrl
  // debugDomain('req.publicBaseUrl', req.publicBaseUrl)
  // req.publicWsBaseUrl = req.publicBaseUrl.replace('http:', 'ws:').replace('https:', 'wss:')
  // debugDomain('req.publicWsBaseUrl', req.publicWsBaseUrl)
  // req.publicBasePath = basePath
  // debugDomain('req.publicBasePath', req.publicBasePath)
  next()
}
