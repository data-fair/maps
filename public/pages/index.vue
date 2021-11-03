<template>
  <div>
    <!-- <maplibre :map-style="`${env.publicUrl}/api/styles/default.json`" /> -->
  </div>
</template>

<script>
  import maplibre from '~/components/maplibre'
  import { mapState } from 'vuex'
  export default {
    components: {
      maplibre,
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
body { margin: 0; padding: 0; }
</style>
