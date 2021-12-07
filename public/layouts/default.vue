
<template>
  <v-app>
    <v-main>
      <app-bar />
      <events />
      <nuxt />
    </v-main>
  </v-app>
</template>

<script>

  import AppBar from '~/components/layout/app-bar'
  import events from '~/components/events'
  export default {
    components: {
      AppBar,
      events,
    },
  }
</script>

<style>

</style>
