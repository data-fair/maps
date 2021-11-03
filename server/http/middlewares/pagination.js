
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
