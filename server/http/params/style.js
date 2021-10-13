const memoizee = require('memoizee')

let getCachedStyle
module.exports = async (req, res, next) => {
  if (!getCachedStyle) {
    getCachedStyle = memoizee(async (style) => {
      return await req.app.get('db').collection('styles').findOne({ _id: style })
    }, { maxAge: 10000, promise: true })
  }

  req.style = await getCachedStyle(req.params.style)
  if (!req.style) { return res.status(404).send('Style not found') }
  next()
}
