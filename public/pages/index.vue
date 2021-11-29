<template>
  <div>
    <!-- <maplibre
      :map-style="{
        version:8,
        sources:{
          tileset:{
            type:'vector',
            url:env.publicUrl+'/api/tilesets/openmaptiles.json'
          }
        },
        layers:[]
      }"
      inspect
    /> -->
  </div>
</template>

<script>
  // import maplibre from '~/components/maplibre'
  import { mapState } from 'vuex'
  export default {
    components: {
      // maplibre,
    },
    middleware: 'auth',
    data: () => ({}),
    computed: {
      ...mapState(['env']),
    },
    async mounted() {},
  }
</script>

<style>

</style>
