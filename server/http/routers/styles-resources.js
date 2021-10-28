const router = require('express').Router({ mergeParams: true })

router.use(require('../params/style'))

router.get('/sprite.json', (req, res) => {
  if (req.style.sprite_json) res.send(req.style.sprite_json)
  else res.sendStatus(404)
})

router.get('/sprite.png', (req, res) => {
  if (req.style.sprite_png) {
    res.set({ 'Content-Type': 'image/png' })
    res.send(req.style.sprite_png)
  } else res.sendStatus(404)
})

module.exports = router
