<i18n lang="yaml">
fr:
  tooltip: Aperçu

en:
  tooltip: Preview

</i18n>

<template>
  <v-dialog fullscreen>
    <template #activator="{on:dialog,attrs}">
      <v-tooltip bottom>
        <template #activator="{ on:tooltip }">
          <v-icon
            class="mx-1"
            v-bind="attrs"
            v-on="{...dialog,...tooltip}"
            v-text="'mdi-map-search'"
          />
        </template>
        <span v-text="$t('tooltip')" />
      </v-tooltip>
    </template>
    <!-- <template #default="dialog"> -->
    <v-card style="height:80vh">
      <v-card-text class="pa-0 ma-0">
        <maplibre
          :map-style="`${env.publicUrl}/api/styles/${value._id}.json`"
          width="100%"
          height="80vh"
        />
      </v-card-text>
    </v-card>
    <!-- </template> -->
  </v-dialog>
</template>

<script>
  import maplibre from '~/components/maplibre'
  import { mapState } from 'vuex'

  export default {
    components: {
      maplibre,
    },
    props: {
      value: { type: Object, required: true },
    },
    computed: {
      ...mapState(['env']),
    },
  }
</script>

<style>

</style>
