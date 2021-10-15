const fontsUtils = require('../../utils/fonts')

const router = module.exports = require('express').Router()

//

//

//

router.get('/:fontStack/:range(\\d+\\-\\d+).pbf', async (req, res) => {
  try {
    const fonts = await fontsUtils.getFonts(req.params.fontStack, req.params.range)
    if (fonts) return res.send(fonts)
  } catch (error) {
    console.error(error)
  }
  res.status(404).send()
})

// router.get('', async (req, res) => {
//   res.send(await req.app.get('db').collection('styles').find().toArray())
// })
