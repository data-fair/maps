export default async ({ store, app, env, $vuetify, route, i18n }) => {
  const basePath = new URL(env.publicUrl).pathname
  let publicUrl = window.location.origin + basePath
  if (publicUrl.endsWith('/')) publicUrl = publicUrl.substr(0, publicUrl.length - 1)

  const baseDirectoryPath = new URL(env.directoryUrl).pathname
  let directoryUrl = window.location.origin + baseDirectoryPath
  if (directoryUrl.endsWith('/')) directoryUrl = directoryUrl.substr(0, directoryUrl.length - 1)

  store.commit('setAny', {
    env: {
      ...env,
      // reconstruct this env var that we used to have but lost when implementing multi-domain exposition
      publicUrl,
    },
  })

  store.dispatch('session/init', {
    cookies: app.$cookies,
    directoryUrl: directoryUrl,
  })

  // support opening with active account defined in URL
  if (route.query.account) {
    const parts = route.query.account.split(':')
    if (parts[0] === 'user') {
      store.dispatch('session/switchOrganization', null)
    } else {
      store.dispatch('session/switchOrganization', parts[1])
    }
    window.onNuxtReady(() => {
      const query = { ...route.query }
      delete query.account
      app.router.replace({ query })
    })
  }
  store.dispatch('session/loop', app.$cookies)
  if (app.$cookies.get('theme_dark') !== undefined) $vuetify.theme.dark = app.$cookies.get('theme_dark')
  if (route.query.dark) $vuetify.theme.dark = route.query.dark === 'true'
}
