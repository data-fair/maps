// const benchtest = require("benchtest");
// benchtest(null,{log:"json"}); // with the default Node.js Mocha tools, the first arg will always be null
// beforeEach(benchtest.test);
// after(benchtest.report);
const config = require('config')
const axios = require('axios')
const axiosAuth = require('@koumoul/sd-express').axiosAuth

before('start server', async function () {
  try {
    global.app = await require('../server/app').start()
  } catch (err) {
    console.error('Failed to run the application', err)
    throw err
  }
})

before('init axios', async () => {
  global.ax = {}
  global.ax.builder = async (email, org, opts = {}) => {
    opts.baseURL = opts.baseURL || config.publicUrl

    let ax
    if (email) ax = await axiosAuth(email, org, opts)
    else ax = axios.create(opts)
    // customize axios errors for shorter stack traces when a request fails in a test
    ax.interceptors.response.use(response => response, error => {
      if (!error.response) return Promise.reject(error)
      delete error.response.request
      return Promise.reject(error.response)
    })
    return ax
  }
  await Promise.all([
    // global.ax.builder().then(ax => { global.ax.anonymous = ax }),
    // global.ax.builder('dmeadus0@answers.com:passwd').then(ax => { global.ax.dmeadus = ax }),
    // global.ax.builder('dmeadus0@answers.com:passwd', 'KWqAGZ4mG').then(ax => { global.ax.dmeadusOrg = ax }),
    // global.ax.builder('cdurning2@desdev.cn:passwd').then(ax => { global.ax.cdurning2 = ax }),
    // global.ax.builder('alone@no.org:passwd').then(ax => { global.ax.alone = ax }),
    global.ax.builder('superadmin@test.com:superpasswd:adminMode').then(ax => { global.ax.superadmin = ax }),
    global.ax.builder('banchereau.tom@gmail.com:passwd:adminMode', undefined, { baseURL: config.publicUrl2 }).then(ax => { global.ax.tomban = ax }),
    global.ax.builder('alban.mouton@koumoul.com:passwd:adminMode', undefined, { baseURL: config.publicUrl }).then(ax => { global.ax.alban = ax }),
    // global.ax.builder('hlalonde3@desdev.cn:passwd').then(ax => { global.ax.hlalonde3 = ax }),
    // global.ax.builder('ngernier4@usa.gov:passwd').then(ax => { global.ax.ngernier4 = ax }),
    // global.ax.builder('ddecruce5@phpbb.com:passwd').then(ax => { global.ax.ddecruce5 = ax }),
    // global.ax.builder('bhazeldean7@cnbc.com:passwd').then(ax => { global.ax.bhazeldean7 = ax }),
    // global.ax.builder('bhazeldean7@cnbc.com:passwd', 'KWqAGZ4mG').then(ax => { global.ax.bhazeldean7Org = ax }),
    // global.ax.builder('ngernier4@usa.gov:passwd', 'KWqAGZ4mG').then(ax => { global.ax.ngernier4Org = ax }),
    // global.ax.builder('icarlens9@independent.co.uk:passwd').then(ax => { global.ax.icarlens9 = ax }),
  ])
})

before('clean mongo', async () => {
  // await global.app.db.drop()
})

after('stop app', async () => {
  // await require('../server/app').stop()
})
