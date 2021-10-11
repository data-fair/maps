
const router = module.exports = require('express').Router()

router.param('style', require('../params/style'))

//

//

//

router.get('/:style.json', async (req, res) => {
  res.send(req.style)
})

router.get('', async (req, res) => {
  res.send(await req.app.get('db').collection('styles').find().toArray())
})
