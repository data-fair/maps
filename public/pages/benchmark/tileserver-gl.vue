<template>
  <v-container>
    <!-- :loading="$fetchState.pending" -->
    <benchmark
      :urls="urls"
      title="Benchmark Tileserver-gl"
    />
  </v-container>
</template>

<script>
  import geoJSONs from '~/assets/vannes'
  import { mapState } from 'vuex'
  export default {
    layout: 'benchmark',
    computed: {
      ...mapState(['env']),
      urls() {
        return geoJSONs.filter((v, i) => i < 1000).map((source) => {
          return `https://staging-koumoul.com/s/tileserver/styles/osm-bright/static/auto/500x500.png?path=${source.coordinates.map((lonlat) => lonlat.join(',')).join('|')}&width=5`
        })
      },
    },
  }
</script>

<style>

</style>
