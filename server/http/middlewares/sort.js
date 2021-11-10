
require('../api-docs').components.parameters.sort = {
  name: 'sort',
  in: 'query',
  // description: 'sort',
}
module.exports = (defaultSort) => (req, res, next) => {
  req.sort = defaultSort || {}
  if (req.query.sort) {
    for (const s of req.query.sort.split(',')) {
      const toks = s.split(':')
      if (![1, -1].includes(Number(toks[1]))) return res.status(400).send('Invalid sort value')
      req.sort[toks[0]] = Number(toks[1])
    }
  }
  next()
}
