const asyncWrap = require('../../utils/async-wrap')
const assert = require('assert')
const ajv = new (require('ajv'))()

module.exports = (schema) => {
  assert.equal(typeof (schema), 'object')
  const validate = ajv.compile(schema)

  return asyncWrap(async (req, res, next) => {
    const valid = validate(JSON.parse(JSON.stringify(req.body)))
    if (!valid) return res.status(400).send(validate.errors)
    else next()
  })
}
