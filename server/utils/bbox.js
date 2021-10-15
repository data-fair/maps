const geojsonBounds = require('geojson-bounds')
const mercator = new (require('@mapbox/sphericalmercator'))()

module.exports = {
  getBBoxFromGeojsonStyleSource(sources) {
    const geojsonSources = Object.values(sources).filter(s => s.type === 'geojson')
    const bbox = geojsonSources.map(source => geojsonBounds.extent(source.data))
    return bbox.reduce((acc, bbox) => {
      acc[0] = Math.min(bbox[0], acc[0])
      acc[1] = Math.min(bbox[1], acc[1])
      acc[2] = Math.max(bbox[2], acc[2])
      acc[3] = Math.max(bbox[3], acc[3])
      return acc
    })
  },
  getZoom({ bbox, width, height, padding = 0.1 }) {
    let z = 25

    const minCorner = mercator.px([bbox[0], bbox[3]], z)
    const maxCorner = mercator.px([bbox[2], bbox[1]], z)
    const w_ = width / (1 + 2 * padding)
    const h_ = height / (1 + 2 * padding)

    z -= Math.log(Math.max(
      (maxCorner[0] - minCorner[0]) / w_,
      (maxCorner[1] - minCorner[1]) / h_,
    )) / Math.LN2

    return Math.max(Math.log(Math.max(width, height) / 256) / Math.LN2, Math.min(25, z)) - 1
  },
  getCenter(bbox) {
    return [
      (bbox[0] + bbox[2]) / 2,
      (bbox[1] + bbox[3]) / 2,
    ]
  },
}
