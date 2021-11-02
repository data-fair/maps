module.exports = {
  escapePublicUrl(style, publicBaseUrl) {
    return JSON.parse(JSON.stringify(style)
      .split('maps://').join('maps://maps://')
      .split(publicBaseUrl + '/').join('maps://'))
  },
  injectPublicUrl(style, publicBaseUrl) {
    return JSON.parse(JSON.stringify(style)
      .split('maps://maps://')
        .map(s => s.replace(/maps:\/\//gi, publicBaseUrl + '/'))
        .join('maps://'),
    )
  },
}
