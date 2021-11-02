<template>
  <v-app>
    <v-main>
      <v-app-bar>
        <!-- <v-btn text :to="{name:'index'}">
          Map
        </v-btn> -->
        <v-btn text :to="{name:'styles'}">
          Styles
        </v-btn>
        <v-btn text :to="{name:'tilesets'}">
          Tilesets
        </v-btn>
        <v-btn text :to="{name:'render-demo'}">
          Render-demo
        </v-btn>
      </v-app-bar>
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
