export default function auth ({ redirect, store, error }) {
  if (!store.state.session || !store.state.session.user) {
    return store.dispatch('session/login')
  }
  // const user = store.state.session.user
  // if (!user.organizations || !user.organizations.length) {
  //   return console.error('Cet utilisateur n\'est membre d\'aucune organisation')
  // }
  // if (!user.organization) {
  //   store.dispatch('session/switchOrganization', user.organizations[0].id)
  //   store.dispatch('fetchSettings')
  //   store.dispatch('fetchFleets')
  //   return store.dispatch('fetchPermissions')
  // } else {
  //   if (store.state.permissions.suspended) error({ suspended: true })
  // }
}
