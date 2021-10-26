const memoizee = require('memoizee')
const asyncWrap = require('../../utils/async-wrap')
require('../api-docs').components.parameters.style = {
  name: 'style',
  in: 'path',
  description: 'id of the style',
  required: true,
}

let getCachedStyle
module.exports = asyncWrap(async (req, res, next) => {
  if (!getCachedStyle) {
    getCachedStyle = memoizee(async (style) => {
      return await req.app.get('db').collection('styles').findOne({ _id: style })
    }, { maxAge: 10000, promise: true })
  }

  req.style = await getCachedStyle(req.params.style)
  if (!req.style) { return res.status(404).send('Style not found') }
  if (req.method === 'PUT') getCachedStyle.delete(req.params.style)
  // req.style = await req.app.get('db').collection('styles').findOne({ _id: req.params.style })
  next()
})
