<i18n lang="yaml">
fr:
  title: Historique d'importation
  table-header-date: Date
  table-header-area: Zone
  table-header-tile-imported: Tuiles importées
en:
  title: Importation history
  table-header-date: Date
  table-header-area: Area
  table-header-tile-imported: Imported tiles
</i18n>

<template>
  <v-card
    elevation="0"
    tile
    class="mx-2"
  >
    <v-card-title v-text="$t('title')" />
    <v-simple-table tile dense>
      <thead>
        <tr>
          <th class="text-left" v-text="$t('table-header-date')" />
          <th class="text-left" v-text="$t('table-header-area')" />
          <th class="text-left" v-text="$t('table-header-tile-imported')" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="task in history" :key="task._id">
          <td>{{ task.date }}</td>
          <td>{{ (task.options && task.options.area) || '' }}</td>
          <td>{{ task.tileImported }}</td>
        </tr>
      </tbody>
    </v-simple-table>
  </v-card>
</template>

<script>
  import { mapState } from 'vuex'
  export default {
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
