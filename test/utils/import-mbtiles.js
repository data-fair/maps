const eventToPromise = require('event-to-promise')
const FormData = require('form-data')
const fs = require('fs')

module.exports = {
  postMBTiles: async(file, area, excludeProps = [], excludeLayers = []) => {
    const formData = new FormData()
    formData.append('tileset.mbtiles', fs.createReadStream(file))
    for (const excludeProp of excludeProps) {
      formData.append('excludeProp', excludeProp)
    }
    for (const excludeLayer of excludeLayers) {
      formData.append('excludeLayer', excludeLayer)
    }
    if (area) formData.append('area', area)
    let tileset = (await global.ax.superadmin.post('/api/tilesets', formData, { headers: formData.getHeaders() })).data
    await eventToPromise(global.app.workers.importMBTiles.events, `imported:${tileset._id}`)
    tileset = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}.json`)).data
    return tileset
  },
  putMBTiles: async(file, _id, area) => {
    const formData = new FormData()
    formData.append('tileset.mbtiles', fs.createReadStream(file))
    if (area) formData.append('area', area)
    let tileset = (await global.ax.superadmin.put('/api/tilesets/' + _id, formData, { headers: formData.getHeaders() })).data
    await eventToPromise(global.app.workers.importMBTiles.events, `imported:${tileset._id}`)
    tileset = (await global.ax.superadmin.get(`/api/tilesets/${tileset._id}.json`)).data
    return tileset
  },
  patchTileset: async(file, _id, area) => {
    const formData = new FormData()
    formData.append('tileset.mbtiles', fs.createReadStream(file))
    if (area) formData.append('area', area)
    await global.ax.superadmin.patch('/api/tilesets/' + _id, formData, { headers: formData.getHeaders() })
    await eventToPromise(global.app.workers.importMBTiles.events, `imported:${_id}`)
    const tileset = (await global.ax.superadmin.get(`/api/tilesets/${_id}.json`)).data
    return tileset
  },
}
