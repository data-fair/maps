<i18n lang="yaml">
fr:
  title: Styles
  copy-url-tooltip: Copier l'adresse du style
  add-style: Ajouter un style
  preview-tooltip: Aperçu
  search: Rechercher
  noResult: Aucun style ne correspond aux critères de recherche.
en:
  title: Styles
  copy-url-tooltip: Copy style url to clipboard
  add-style: Add a style
  preview-tooltip: Preview
  search: Search
  noResult: No style matches your search criterias.
</i18n>

<template>
  <v-row>
    <v-col :style="$vuetify.breakpoint.lgAndUp ? 'padding-right:256px;' : ''">
      <v-container>
        <v-card :loading="$fetchState.pending" flat>
          <v-card-title>
            {{ $t('title') }}
          </v-card-title>
          <v-card-text v-if="!$fetchState.pending">
            <v-row v-if="items.length">
              <v-col
                v-for="item in items"
                :key="item._id"
                class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
              >
                <v-card outlined>
                  <v-img
                    :src="`${env.publicUrl}/api/render/${item._id}/640x360.png?lon=${item.center ? item.center[0] : 0}&lat=${item.center ? item.center[1] : 0}&zoom=${item.zoom || 0}`"
                    height="240"
                  />
                  <v-card-title class="pa-2" v-text="item.name" />
                  <!-- <v-card-subtitle
                    class="px-2 py-2"
                    v-text="item._id"
                  /> -->
                  <v-card-actions class="justify-end">
                    <copy-icon :value="`${env.publicUrl}/api/styles/${item._id}.json`" :label="$t('copy-url-tooltip')" />

                    <v-tooltip bottom>
                      <template #activator="{ on }">
                        <v-btn
                          class="mx-1"
                          :to="{name:embed?'embed-styles-id-preview':'styles-id-preview',params:{id:item._id}}"
                          nuxt
                          icon
                          v-on="on"
                        >
                          <v-icon>mdi-map-search</v-icon>
                        </v-btn>
                      </template>
                      <span v-text="$t('preview-tooltip')" />
                    </v-tooltip>
                    <import-dialog
                      v-if="isAdmin"
                      :value="item"
                      icon
                      @change="$fetch"
                    />
                    <edit-dialog
                      v-if="isAdmin"
                      :value="item"
                      @change="$fetch"
                    />
                    <delete-dialog
                      v-if="isAdmin"
                      :value="item"
                      @change="$fetch"
                    />
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
            <v-row v-else align="center">
              <v-col class="text-center">
                <div
                  v-t="'noResult'"
                  class="text-h6"
                />
              </v-col>
            </v-row>
            <v-pagination
              v-if="pageCount > 1"
              v-model="page"
              :length="pageCount"
              @input="$fetch"
            />
          </v-card-text>
        </v-card>
        <v-navigation-drawer
          v-if="$vuetify.breakpoint.lgAndUp"
          class="navigation-right pl-2"
          right
          permanent
          clipped
          floating
          fixed
          style="padding-top: 60px"
          color="transparent"
        >
          <v-list
            v-if="isAdmin"
            dense
            class="list-actions"
          >
            <v-subheader v-t="'add-style'" />
            <import-dialog
              @change="$fetch"
            />
          </v-list>
          <v-row class="px-2">
            <v-col>
              <v-text-field
                v-model="q"
                :placeholder="$t('search')"
                outlined
                dense
                color="primary"
                append-icon="mdi-magnify"
                hide-details
                @keyup.enter.native="page=1;$fetch()"
                @click:append="page=1;$fetch()"
              />
            </v-col>
          </v-row>
        </v-navigation-drawer>
      </v-container>
    </v-col>
  </v-row>
</template>

<script>
  import editDialog from '~/components/style/edit-dialog'
  import deleteDialog from '~/components/style/delete-dialog'
  import importDialog from '~/components/style/import-dialog'

  import { mapState } from 'vuex'
  export default {
    components: {
      editDialog, deleteDialog, importDialog,
    },
    props: {
      embed: { type: Boolean, default: false },
    },
    data: () => ({
      q: '',
      page: 1,
      itemCount: undefined,
      items: [],
    }),
    async fetch() {
      const { results, count } = await this.$axios.$get(this.env.publicUrl + '/api/styles?size=12&page=' + this.page + '&q=' + this.q)
      this.items = results
      this.itemCount = count
    },
    computed: {
      pageCount() {
        return Math.ceil((this.itemCount || 0) / 12)
      },
      ...mapState(['env']),
      ...mapState(['session']),
      isAdmin() {
        return this.session && this.session.user && this.session.user.adminMode
      },
    },
    async mounted() {
      await this.$fetch()
    },
  }
</script>

<style>

</style>
