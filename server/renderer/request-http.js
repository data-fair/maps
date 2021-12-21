
const http = require('http')
const https = require('https')
const cacheableLookup = new (require('cacheable-lookup'))()

const httpAgent = new http.Agent()
const httpsAgent = new https.Agent()
cacheableLookup.install(httpAgent)
cacheableLookup.install(httpsAgent)

const axios = require('axios').create({
    httpAgent, httpsAgent,
})

module.exports = async (req, { db, context }) => {
    const axiosOption = {
        responseType: 'arraybuffer',
    }
    if (context.publicBaseUrl && context.cookie && new URL(context.publicBaseUrl).hostname === new URL(req.url).hostname) axiosOption.headers = { cookie: context.cookie }
    return await axios.get(req.url, axiosOption)
}
