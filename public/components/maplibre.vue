<template>
  <div
    ref="map"
    :style="`width:${width};height:calc(100vh-60px);`"
    class="map"
  >
    <!--  -->
  </div>
</template>

<script>
  // import maplibregl from 'maplibre-gl'
  require('maplibre-gl/dist/maplibre-gl.css')
  require('maplibre-gl-inspect/dist/maplibre-gl-inspect.css')
  const maplibregl = require('maplibre-gl')
  const MaplibreInspect = require('maplibre-gl-inspect')
  export default {
    props: {
      mapStyle: { type: [Object, String], required: true },
      inspect: { type: String, default: undefined },
      height: { type: String, default: '300px' },
      width: { type: String, default: '300px' },
      hash: { type: Boolean, default: false },
    },
    data: () => ({
      map: undefined,
    }),
    async mounted() {
      this.map = new maplibregl.Map({
        container: this.$refs.map,
        style: this.mapStyle,
        hash: this.hash,
      })
      if (this.inspect !== undefined && this.inspect !== false) {
        this.map.showTileBoundaries = true
        this.map.addControl(new MaplibreInspect({
          popup: new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
          }).setMaxWidth('100vw'),
          showInspectMap: this.inspect !== 'toggle',
          showInspectButton: this.inspect === 'toggle',
        }))
      }
      await this.$nextTick()
      this.map.resize()
    },
    async destroy() {
      this.map.stop()
    },
  }
</script>

<style>

.map { display: absolute; }

</style>
