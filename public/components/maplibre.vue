<template>
  <div
    ref="map"
    style="flex-grow:1"
    class="map"
  >
    <!--  -->
  </div>
</template>

<script>
  // import maplibregl from 'maplibre-gl'
  const maplibregl = require('maplibre-gl')
  export default {
    props: {
      mapStyle: { type: [String, Object], required: true },
    },
    data: () => ({
      map: undefined,
    }),
    async mounted() {
      this.map = new maplibregl.Map({
        container: this.$refs.map,
        style: this.mapStyle,
      })
    },
  }
</script>

<style>

.map { position: absolute; top: 0; bottom: 0; width: 100%; }

</style>
