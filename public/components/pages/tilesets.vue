<i18n lang="yaml">
fr:
  title: Tilesets

  add-tileset: Ajouter un tileset

  filter: Filtre
  search: Rechercher
  format: Format de tuile
  format-raster: Tuile raster
  format-vector: Tuile vectorielle

  inspect-tooltip: Inspecter

en:
  title: Tilesets

  add-tileset: Add tileset

  filter: Filter
  search: Search
  format: Tile format
  format-raster: Raster tile
  format-vector: Vector tile

  inspect-tooltip: Inspect

</i18n>

<template>
  <v-row>
    <v-col :style="$vuetify.breakpoint.lgAndUp ? 'padding-right:256px;' : ''">
      <v-container>
        <v-card :loading="$fetchState.pending" flat>
          <v-card-title>
            {{ $t('title') }}
            <!-- <v-spacer /> -->
            <!-- <v-icon @click="$fetch" v-text="'mdi-refresh'" /> -->
            <!-- <import-dialog @change="$fetch" /> -->
          </v-card-title>
          <v-card-text>
            <!-- <template #item.data-table-expand="{ item }">
                <v-row class="justify-end">
                  <v-tooltip bottom>
                    <template #activator="{ on }">
                      <v-btn
                        class="mx-1"
                        :to="{name:embed?'embed-tilesets-id':'tilesets-id',params:{id:item._id}}"
                        nuxt
                        icon
                        v-on="on"
                      >
                        <v-icon>mdi-map-search</v-icon>
                      </v-btn>
                    </template>
                    <span v-text="$t('inspect-tooltip')" />
                  </v-tooltip>
                  <status-icon :value="item" />
                  <import-dialog :value="item" @change="$fetch" />
                  <delete-tileset :value="item" @change="$fetch" />
                </v-row>
              </template> -->
            <v-row v-if="items.length">
              <v-col
                v-for="item in items"
                :key="item._id"
                class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-3"
              >
                <v-card outlined>
                  <v-img
                    :src="`${env.publicUrl}/api/tilesets/${item._id}/preview/640x360.png`"
                  />
                  <v-card-title class="pa-2" v-text="item.name" />
                  <!-- <v-card-subtitle
                    class="px-2 py-2"
                    v-text="item._id"
                  /> -->
                  <v-card-actions class="justify-end">
                    <v-tooltip bottom>
                      <template #activator="{ on }">
                        <v-btn
                          class="mx-1"
                          :to="{name:embed?'embed-tilesets-id':'tilesets-id',params:{id:item._id}}"
                          nuxt
                          icon
                          v-on="on"
                        >
                          <v-icon>mdi-map-search</v-icon>
                        </v-btn>
                      </template>
                      <span v-text="$t('inspect-tooltip')" />
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
            <v-subheader v-t="'add-tileset'" />
            <import-dialog
              @change="$fetch"
            />
          </v-list>
          <v-list
            dense
            class="list-actions"
          >
            <v-subheader v-t="'filter'" />
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
                <v-select
                  v-model="format"
                  clearable
                  :label="$t('format')"
                  item-text="label"
                  item-value="format"
                  :items="[
                    {format:'jpg',label:$t('format-raster')},
                    {format:'pbf',label:$t('format-vector')},
                  ]"
                  @change="page=1;$fetch()"
                />
              </v-col>
            </v-row>
          </v-list>
        </v-navigation-drawer>
      </v-container>
    </v-col>
  </v-row>
</template>

<script>
  import importDialog from '~/components/tileset/import-dialog'
  import deleteDialog from '~/components/tileset/delete-dialog'
  // import statusIcon from '~/components/tileset/status-icon.vue'
  import { mapState } from 'vuex'
  export default {
    components: {
      importDialog,
      deleteDialog,
      // statusIcon,
    },
    props: {
      embed: { type: Boolean, default: false },
    },
    data () {
      return {
        q: '',
        page: 1,
        itemCount: undefined,
        items: [],
        format: undefined,
      }
    },
    async fetch() {
      await this.$nextTick()
      // const sort = ((this.options && this.options.sortBy && this.options.sortBy.length) ? `&sort=${this.options.sortBy.map((sort, index) => `${sort}:${this.options.sortDesc[index] ? -1 : 1}`)}` : '')
      let url = `${this.env.publicUrl}/api/tilesets?size=12&page=${this.page}&q=${this.q}`
      if (this.format) url += `&format=${this.format}`
      const { results, count } = await this.$axios.$get(url)
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
