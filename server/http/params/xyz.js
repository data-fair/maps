const asyncWrap = require('../../utils/async-wrap')
require('../api-docs').components.parameters.x = {
  name: 'x',
  in: 'path',
  description: 'x coordinate of the tile',
  required: true,
  schema: { type: 'number' },
}

module.exports.x = asyncWrap(async (req, res, next) => {
  req.params.x = parseInt(req.params.x)
  if (isNaN(req.params.x)) return res.statu(400).send('x parameter should be an integer')
  next()
})

require('../api-docs').components.parameters.y = {
  name: 'y',
  in: 'path',
  description: 'y coordinate of the tile',
  required: true,
  schema: { type: 'number' },
}

module.exports.y = asyncWrap(async (req, res, next) => {
  req.params.y = parseInt(req.params.y)
  if (isNaN(req.params.y)) return res.statu(400).send('y parameter should be an integer')
  next()
})

require('../api-docs').components.parameters.z = {
  name: 'z',
  in: 'path',
  description: 'z coordinate of the tile',
  required: true,
  schema: { type: 'number' },
}

module.exports.z = asyncWrap(async (req, res, next) => {
  req.params.z = parseInt(req.params.z)
  if (isNaN(req.params.z)) return res.statu(400).send('z parameter should be an integer')
  next()
})
