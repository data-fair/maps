<i18n lang="yaml">
fr:
  tooltip: Inspecter

en:
  tooltip: Inspect

</i18n>

<template>
  <v-dialog v-if="value.vector_layers || value.format==='jpg'">
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
          :map-style="value.vector_layers?{
            version:8,
            sources:{
              tileset:{
                type:'vector',
                url:env.publicUrl+'/api/tilesets/'+value._id+'.json'
              }
            },
            layers:[]
          }:{
            version:8,
            sources:{
              raster:{
                type:'raster',
                url:env.publicUrl+'/api/tilesets/'+value._id+'.json'
              }
            },
            layers:[
              {
                id:'raster',
                source:'raster',
                type:'raster'
              }
            ]
          }"
          inspect
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
