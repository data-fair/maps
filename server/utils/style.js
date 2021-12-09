const { generateInspectStyle, generateColoredLayers } = require('maplibre-gl-inspect/lib/stylegen')

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
  generateInspectStyle(style) {
    const colors = require('maplibre-gl-inspect/lib/colors').brightColor
    const coloredLayers = generateColoredLayers(Object.assign(
      ...(Object.keys(style.sources).filter(s => style.sources[s].type === 'vector' && style.sources[s].vector_layers).map(s => ({ [s]: style.sources[s].vector_layers.map(v => v.id) })).concat({})),
    ), colors)
    return generateInspectStyle(style, coloredLayers)
  },
}
