const asyncWrap = require('../../utils/async-wrap')

require('../api-docs').components.parameters.tileFormat = {
  name: 'format',
  in: 'path',
  description: 'format of the tile',
  required: true,
}

module.exports = asyncWrap(async (req, res, next) => {
  if (req.tilesetInfo && req.params.tileFormat !== req.tilesetInfo.format) {
    return res.status(400).send('Wrong format')
  }
  // req.params.x = parseInt(req.params.x)
  // if (isNaN(req.params.x)) return res.statu(400).send('x parameter should be an integer')
  next()
})
