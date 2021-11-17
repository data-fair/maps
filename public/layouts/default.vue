<i18n lang="yaml">
fr:
  title-styles: Styles
  title-tilesets: Tilesets
en:
  title-styles: Styles
  title-tilesets: Tilesets
</i18n>

<template>
  <v-app>
    <v-main>
      <v-app-bar>
        <v-btn
          text
          :to="{name:'styles'}"
          v-text="$t('title-styles')"
        />
        <v-btn
          text
          :to="{name:'tilesets'}"
          v-text="$t('title-tilesets')"
        />
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
