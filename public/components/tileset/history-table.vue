<i18n lang="yaml">
fr:
  title: Historique d'importation
  table-header-date: Date
  table-header-area: Zone
  table-header-tile-imported: Tuiles importées
  table-header-version: Version
  table-header-size: Taille des données importées
en:
  title: Importation history
  table-header-date: Date
  table-header-area: Area
  table-header-tile-imported: Imported tiles
  table-header-version: Version
  table-header-size: Imported data size
</i18n>

<template>
  <v-card
    elevation="0"
    tile
    class="mx-2"
    :loading="$fetchState.pending"
  >
    <v-card-title v-text="$t('title')" />
    <v-simple-table
      tile
      dense
    >
      <thead>
        <tr>
          <th class="text-left" />
          <th class="text-left" v-text="$t('table-header-version')" />
          <th class="text-left" v-text="$t('table-header-date')" />
          <th class="text-left" v-text="$t('table-header-area')" />
          <th class="text-left" v-text="$t('table-header-tile-imported')" />
          <th class="text-left" v-text="$t('table-header-size')" />
        </tr>
      </thead>
      <tbody v-if="!$fetchState.pending">
        <tr v-for="task in history" :key="task._id">
          <td><status-icon :value="task" /></td>
          <td>{{ task.version }}</td>
          <td>{{ new Date(task.date) }}</td>
          <td>{{ (task.options && task.options.area) || '' }}</td>
          <td>{{ task.tileImported }} / {{ task.tileCount }}</td>
          <td>{{ task.importedSize/1000 }} KB</td>
        </tr>
      </tbody>
    </v-simple-table>
  </v-card>
</template>

<script>
  import { mapState } from 'vuex'
  import statusIcon from '~/components/tileset/status-icon.vue'
  export default {
    components: { statusIcon },
    props: {
      value: { type: String, required: true },
    },
    data: () => ({
      history: undefined,
    }),
    async fetch() {
      this.history = (await this.$axios.$get(this.env.publicUrl + '/api/tilesets/' + this.value + '/import-history')).results
    },
    computed: {
        ...mapState(['env']),
    },
    watch: {
      value() {
        this.$fetch()
      },
    },
  }
</script>

<style>

</style>
