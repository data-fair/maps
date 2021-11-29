
<template>
  <v-app>
    <v-main>
      <events />
      <nuxt />
    </v-main>
  </v-app>
</template>

<script>
  import events from '~/components/events'
  export default {
    components: { events },
  }
</script>

<style>

</style>
