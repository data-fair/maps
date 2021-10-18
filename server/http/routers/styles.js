const { escapePublicUrl, injectPublicUrl } = require('../../utils/style')
const { nanoid } = require('nanoid')
const router = module.exports = require('express').Router()

router.param('style', require('../params/style'))

//

//

//

router.get('/:style.json', async (req, res) => {
  const style = injectPublicUrl(req.style, req.publicBaseUrl)
  res.send(style)
})

router.get('', async (req, res) => {
  res.send(await req.app.get('db').collection('styles').find().toArray().map(s => injectPublicUrl(s, req.publicBaseUrl)))
})

router.post('', async (req, res) => {
  const style = escapePublicUrl(req.body, req.publicBaseUrl)
  style._id = nanoid()
  await req.app.get('db').collection('styles').insertOne(style)
  res.send(injectPublicUrl(style, req.publicBaseUrl))
})
