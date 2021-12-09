<i18n lang="yaml">
fr:
  title-styles: Styles
  title-tilesets: Tilesets
  login-or-register: Se connecter / S'inscrire
  personal-account: Compte personnel
  change-account: Changer de compte
  logout: Se déconnecter
  admin-mode: mode admin
  doc: Documentation d'API
en:
  title-styles: Styles
  title-tilesets: Tilesets
  login-or-register: Login / Register
  personal-account: Personal account
  change-account: Change account
  logout: Logout
  admin-mode: admin mode
  doc: API Documentation
</i18n>

<template>
  <v-app-bar
    app
    flat
    dense
    class="px-0 main-app-bar"
  >
    <v-toolbar-items>
      <v-btn
        text
        nuxt
        style="min-width: 0px;"
        :to="{name: 'index'}"
      >
        <img
          src="https://koumoul.com/s/tileserver/app/_nuxt/img/koumoul-square.624294b.svg"
          height="48px"
          style="min-width: 0px;"
        >
      </v-btn>
      <v-btn

        text
        nuxt
        :to="{name: 'styles'}"
        v-text="$t('title-styles')"
      />
      <v-btn
        text
        nuxt
        :to="{name: 'tilesets'}"
        v-text="$t('title-tilesets')"
      />
    </v-toolbar-items>
    <!-- <v-breadcrumbs
      v-if="breadcrumbs"
      :items="breadcrumbs"
    /> -->
    <v-spacer />
    <v-toolbar-items>
      <!-- v-if="openapiViewerUrl" -->
      <v-btn
        v-t="'doc'"
        :href="openapiViewerUrl"
        text
      />
      <template v-if="initialized">
        <v-btn
          v-if="!user"
          depressed
          color="primary"
          @click="login"
          v-text="$t('login-or-register')"
        />
        <v-menu
          v-else
          offset-y
          nudge-left
          max-height="500"
        >
          <template #activator="{on}">
            <v-btn
              text
              class="px-0"
              v-on="on"
            >
              <v-avatar :size="36">
                <img :src="`${directoryUrl}/api/avatars/${activeAccount.type}/${activeAccount.id}/avatar.png`">
              </v-avatar>
            </v-btn>
          </template>

          <v-list outlined>
            <v-list-item disabled>
              <v-list-item-avatar class="ml-0 my-0">
                <v-avatar :size="28">
                  <img :src="activeAccount.type === 'user' ? `${directoryUrl}/api/avatars/user/${user.id}/avatar.png` : `${directoryUrl}/api/avatars/organization/${activeAccount.id}/avatar.png`">
                </v-avatar>
              </v-list-item-avatar>
              <v-list-item-title>{{ activeAccount.type === 'user' ? $t('personal-account') : activeAccount.name }}</v-list-item-title>
            </v-list-item>

            <template v-if="user.organizations.length">
              <v-subheader v-text="$t('change-account')" />
              <v-list-item
                v-if="activeAccount.type !== 'user'"
                id="toolbar-menu-switch-user"
                @click="switchOrganization(); reload()"
              >
                <v-list-item-avatar class="ml-0 my-0">
                  <v-avatar :size="28">
                    <img :src="`${directoryUrl}/api/avatars/user/${user.id}/avatar.png`">
                  </v-avatar>
                </v-list-item-avatar>
                <v-list-item-title v-text="$t('personal-account')" />
              </v-list-item>
              <v-list-item
                v-for="organization in user.organizations.filter(o => activeAccount.type === 'user' || activeAccount.id !== o.id)"
                :id="'toolbar-menu-switch-orga-' + organization.id"
                :key="organization.id"
                @click="switchOrganization(organization.id); reload()"
              >
                <v-list-item-avatar class="ml-0 my-0">
                  <v-avatar :size="28">
                    <img :src="`${directoryUrl}/api/avatars/organization/${organization.id}/avatar.png`">
                  </v-avatar>
                </v-list-item-avatar>
                <v-list-item-title>{{ organization.name }}</v-list-item-title>
              </v-list-item>
              <v-divider />
            </template>
            <v-divider />

            <!-- toggle admin mode -->
            <template v-if="user.isAdmin">
              <v-list-item dense>
                <v-list-item-action><v-icon>mdi-shield-alert</v-icon></v-list-item-action>
                <v-list-item-title style="overflow: visible;">
                  <v-switch
                    v-model="user.adminMode"
                    color="admin"
                    hide-details
                    class="mt-0"
                    :label="$t('admin-mode')"
                    @change="setAdminMode"
                  />
                </v-list-item-title>
              </v-list-item>
            </template>

            <v-list-item @click="logout">
              <v-list-item-action><v-icon>mdi-logout</v-icon></v-list-item-action>
              <v-list-item-title v-text="$t('logout')" />
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-toolbar-items>
  </v-app-bar>
</template>

<script>
  import { mapState, mapGetters, mapActions } from 'vuex'

  export default {
    computed: {
      ...mapState(['breadcrumbs']),
      ...mapState('session', ['user', 'initialized', 'directoryUrl']),
      ...mapState(['env']),
      openapiViewerUrl() {
        return this.env.openapiViewerUrl ? this.env.openapiViewerUrl + '?proxy=false&url=' + this.env.publicUrl + '/api/api-docs.json' : undefined
      },
      ...mapGetters('session', ['activeAccount']),
    // directoryUrl() {
    //   return this.$store.getters.directoryUrl
    // },
    },
    methods: {
      ...mapActions('session', ['logout', 'login', 'setAdminMode', 'switchOrganization']),
      reload() {
        window.location.reload()
      },
    },
  }
</script>

<style lang="css">
.main-app-bar .v-toolbar__content {
  padding-left: 0;
  padding-right: 0;
}
.main-app-bar .v-toolbar__content {
  padding-left: 0;
  padding-right: 0;
}
</style>
