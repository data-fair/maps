<template>
  <div>
    <div id="map" />
  </div>
</template>

<script>
  import style from '~/assets/style'
  const maplibre = require('maplibre-gl')
  export default {
    data: () => ({
      map: undefined,
    }),
    async mounted() {
      this.map = new maplibre.Map({
        container: 'map', // container ID
        style, // style URL
        center: [-74.5, 40], // starting position [lng, lat]
        zoom: 0, // starting zoom
      })
    },
  }
</script>

<style>
body { margin: 0; padding: 0; }
#map { position: absolute; top: 0; bottom: 0; width: 100%; }
</style>
