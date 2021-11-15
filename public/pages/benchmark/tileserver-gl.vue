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
  import geoJSONs from '~/assets/data-demo'
  import { mapState } from 'vuex'
  export default {
    layout: 'benchmark',
    computed: {
      ...mapState(['env']),
      urls() {
        return geoJSONs.map((source) => {
          return `https://staging-koumoul.com/s/tileserver/styles/osm-bright/static/auto/500x500.png?path=${source.coordinates.map((lonlat) => lonlat.join(',')).join('|')}&width=5`
        })
      },
    },
  }
</script>

<style>

</style>
