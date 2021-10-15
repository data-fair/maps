
const axios = require('axios')

module.exports = async (req, { db, context }) => {
    return await axios.get(req.url, { responseType: 'arraybuffer', headers: { cookie: context.cookie || '' } })
}
