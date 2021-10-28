const axios = require('axios')
const importStyle = require('../server/utils/import-zipped-style')
const styles = { // from https://openmaptiles.org/styles
  'openmaptiles-maptiler-basic': 'https://github.com/openmaptiles/maptiler-basic-gl-style/releases/download/v1.9/v1.9.zip',
  'openmaptiles-osm-bright': 'https://github.com/openmaptiles/osm-bright-gl-style/releases/download/v1.9/v1.9.zip',
  'openmaptiles-positron': 'https://github.com/openmaptiles/positron-gl-style/releases/download/v1.8/v1.8.zip',
  'openmaptiles-dark-matter': 'https://github.com/openmaptiles/dark-matter-gl-style/releases/download/v1.8/v1.8.zip',
  // 'openmaptiles-maptiler-3d': '',
  'openmaptiles-maptiler-terrain': 'https://github.com/openmaptiles/maptiler-terrain-gl-style/releases/download/v1.7/v1.7.zip',
  'openmaptiles-fiord-color': 'https://github.com/openmaptiles/fiord-color-gl-style/releases/download/v1.5/v1.5.zip',
  // 'openmaptiles-toner': '',
  // 'openmaptiles-osm-liberty': '',
}

;(async () => {
  const tileset = process.argv[2]
  const db = await require('../server/mongodb').start()
  await Promise.all(
    Object.keys(styles).map(
      _id => (async () => {
        const { data } = await axios.get(styles[_id], { responseType: 'arraybuffer' })
        await importStyle(db, data, _id, tileset)
      })(),
    ),

  )
  process.exit()
})()
