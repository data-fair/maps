<template>
  <v-container>
    <!-- :loading="$fetchState.pending" -->
    <benchmark
      :urls="urls"
      title="Benchmark Maps"
    />
  </v-container>
</template>

<script>
  import geoJsons from '~/assets/vannes'
  import wkx from 'wkx'
  import { mapState } from 'vuex'
  export default {
    layout: 'benchmark',
    computed: {
      ...mapState(['env']),
      urls() {
        return geoJsons.filter((v) => v.geometry.coordinates.length === 1).map((source) => {
          return `${this.env.publicUrl}/api/render/openmaptiles-maptiler-basic/500x500.png?wkb=${wkx.Geometry.parseGeoJSON(source.geometry).toWkb().toString('base64').split('+').join('-').split('/').join('_')}&wkb-type=line&wkb-width=5`
        })
      },
    },
  }
</script>

<style>

</style>
