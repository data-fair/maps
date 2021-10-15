
const axios = require('axios')

module.exports = async (req, { db, context }) => {
    const axiosOption = {
        responseType: 'arraybuffer',
    }
    if (context.publicBaseUrl && context.cookie && new URL(context.publicBaseUrl).hostname === new URL(req.url).hostname) axiosOption.headers = { cookie: context.cookie }
    return await axios.get(req.url, axiosOption)
}
