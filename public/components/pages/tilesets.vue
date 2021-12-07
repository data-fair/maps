<i18n lang="yaml">
fr:
  title: Tilesets

  tilesets-table-header-id: Identifiant
  tilesets-table-header-name: Nom
  tilesets-table-header-minzoom: Zoom minimum
  tilesets-table-header-maxzoom: Zoom maximum
  tilesets-table-header-tile-format: Format des tuiles
  tilesets-table-header-tile-count: Nombre de tuile
  tilesets-table-header-layer-count: Nombre de couche

  inspect-tooltip: Inspecter

en:
  title: Tilesets

  tilesets-table-header-id: Id
  tilesets-table-header-name: Name
  tilesets-table-header-minzoom: Min zoom
  tilesets-table-header-maxzoom: Max zoom
  tilesets-table-header-tile-format: Tile format
  tilesets-table-header-tile-count: Tile count
  tilesets-table-header-layer-count: Layer count

  inspect-tooltip: Inspect

</i18n>

<template>
  <v-container>
    <v-card
      elevation="5"
    >
      <v-card-title>
        {{ $t('title') }}
        <v-spacer />
        <v-icon @click="$fetch" v-text="'mdi-refresh'" />
        <import-dialog @change="$fetch" />
      </v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="items"
          item-key="_id"
          :loading="$fetchState.pending"
          show-expand
          single-expand
          :options.sync="options"
          :server-items-length="itemCount"
          :footer-props="{'items-per-page-options':[5,10,20,50]}"
        >
          <template #item.format_icon="{item}">
            <v-icon v-if="item.format==='jpg'" v-text="'mdi-image'" />
            <v-icon v-if="item.format==='pbf'" v-text="'mdi-vector-square'" />
          </template>
          <template #expanded-item="{ item }">
            <td :colspan="headers.length" class="pa-0 primary">
              <history-table :value="item._id" />
            </td>
          </template>
          <template #item.data-table-expand="{ expand, isExpanded, item }">
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
              <status-icon :value="item" @click="expand(!isExpanded)" />
              <import-dialog :value="item" @change="$fetch" />
              <delete-tileset :value="item" @change="$fetch" />
            </v-row>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
  import importDialog from '~/components/tileset/import-dialog'
  import deleteTileset from '~/components/tileset/delete-dialog'
  import historyTable from '~/components/tileset/history-table'
  import statusIcon from '~/components/tileset/status-icon.vue'
  import { mapState } from 'vuex'
  export default {
    components: {
      importDialog,
      deleteTileset,
      historyTable,
      statusIcon,
    },
    props: {
      embed: { type: Boolean, default: false },
    },
    data () {
      return {
        options: {},
        itemCount: undefined,
        headers: [
          { text: '', value: 'format_icon', sortable: false },
          { text: this.$t('tilesets-table-header-id'), value: '_id' },
          { text: this.$t('tilesets-table-header-name'), value: 'name' },
          { text: this.$t('tilesets-table-header-minzoom'), value: 'minzoom' },
          { text: this.$t('tilesets-table-header-maxzoom'), value: 'maxzoom' },
          { text: this.$t('tilesets-table-header-tile-format'), value: 'format' },
          { text: this.$t('tilesets-table-header-tile-count'), value: 'tileCount' },
          { text: this.$t('tilesets-table-header-layer-count'), value: 'vector_layers.length' },
          { text: '', value: 'data-table-expand', sortable: false, width: '180px' },
        ],
        items: [],
      }
    },
    async fetch() {
      await this.$nextTick()
      const sort = ((this.options && this.options.sortBy && this.options.sortBy.length) ? `&sort=${this.options.sortBy.map((sort, index) => `${sort}:${this.options.sortDesc[index] ? -1 : 1}`)}` : '')
      const { results, count } = await this.$axios.$get(`${this.env.publicUrl}/api/tilesets?size=${this.options.itemsPerPage}&page=${this.options.page}` + sort)
      this.items = results
      this.itemCount = count
    },
    computed: {
      ...mapState(['env']),
    },
    watch: {
      options: {
        handler () {
          this.$fetch()
        },
        deep: true,
      },
    },
    async mounted() {
      await this.$fetch()
    },
  }
</script>

<style>

</style>
