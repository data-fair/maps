
require('../api-docs').components.parameters.size = {
  name: 'size',
  in: 'query',
  // description: 'size',
}
require('../api-docs').components.parameters.skip = {
  name: 'skip',
  in: 'query',
  // description: 'size',
}
require('../api-docs').components.parameters.page = {
  name: 'page',
  in: 'query',
  // description: 'size',
}
module.exports = (defaultSize = 10) => (req, res, next) => {
  req.pagination = { skip: 0, size: defaultSize }
  if (req.query && req.query.size && !isNaN(parseInt(req.query.size))) {
    req.pagination.size = parseInt(req.query.size)
  }

  if (req.query && req.query.skip && !isNaN(parseInt(req.query.skip))) {
    req.pagination.skip = parseInt(req.query.skip)
  } else if (req.query && req.query.page && !isNaN(parseInt(req.query.page))) {
    req.pagination.skip = (parseInt(req.query.page) - 1) * req.pagination.size
  }
  next()
}
