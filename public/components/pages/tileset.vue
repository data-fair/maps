<i18n lang="yaml">
fr:
  title: Tileset
  layers-title: Détail des couches
  header-field: Champ
  header-type: Type

en:
  title: Tileset
  layers-title: Layers
  header-field: Field
  header-type: Type

</i18n>

<template>
  <v-container>
    <v-card :loading="$fetchState.pending" flat>
      <v-card-title v-if="tileset">
        {{ $t('title')+': '+tileset.name }}
      </v-card-title>
      <v-card-subtitle v-if="tileset" v-text="env.publicUrl+'/api/tilesets/'+tileset._id+'.json'" />
      <v-card-text v-if="tileset">
        <v-row>
          <v-col cols="6">
            <maplibre
              :map-style="tileset.vector_layers?{
                center: [tileset.center?.[0],tileset.center?.[1]],
                zoom: tileset.center?.[2],
                version:8,
                sources:{
                  tileset:{
                    type:'vector',
                    url:env.publicUrl+'/api/tilesets/'+tileset._id+'.json'
                  }
                },
                layers:[]
              }:{
                version:8,
                sources:{
                  raster:{
                    type:'raster',
                    url:env.publicUrl+'/api/tilesets/'+tileset._id+'.json'
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
              style="height:80vh;width:100%"
              inspect
            />
          </v-col>
          <v-col v-if="tileset.vector_layers" cols="6">
            <v-card-title v-t="'layers-title'" />
            <v-card outlined>
              <v-tabs
                vertical
                style="height:70vh"
                class="tileset-inspect-tabs"
              >
                <v-tab
                  v-for="layer in tileset.vector_layers"
                  :key="layer.id"
                  style="text-transform: none;"
                  class="text-left"
                >
                  <v-list-item class="pa-0">
                    <v-list-item-content>
                      <v-list-item-title>{{ layer.id }}</v-list-item-title>
                      <v-list-item-subtitle>Zoom: {{ layer.minzoom }}-{{ layer.maxzoom }}</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-tab>
                <v-tab-item v-for="layer in tileset.vector_layers" :key="layer.id">
                  <v-card flat style="max-height:70vh;overflow-y:auto">
                    <v-card-text>
                      <v-card-title>
                        {{ layer.id }}
                      </v-card-title>
                      <v-card-subtitle class="text-justify">
                        {{ layer.description }}
                      </v-card-subtitle>
                      <v-card-text>
                        <v-simple-table
                          fixed-header
                          dense
                        >
                          <thead>
                            <tr>
                              <th v-t="'header-field'" class="text-left" />
                              <th v-t="'header-type'" class="text-left" />
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="field in Object.keys(layer.fields)" :key="field">
                              <td>{{ field }}</td>
                              <td>{{ layer.fields[field] }}</td>
                            </tr>
                          </tbody>
                        </v-simple-table>
                      </v-card-text>
                    </v-card-text>
                  </v-card>
                </v-tab-item>
              </v-tabs>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <history-table :value="tileset._id" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
  import maplibre from '~/components/maplibre'
  import historyTable from '~/components/tileset/history-table'
  import { mapState } from 'vuex'
  export default {
    components: {
      maplibre,
      historyTable,
    },
    props: {
      tilesetId: { type: String, required: true },
      embed: { type: Boolean, default: false },
    },
    data () {
      return {
        tileset: undefined,
      }
    },
    async fetch() {
      this.tileset = await this.$axios.$get(`${this.env.publicUrl}/api/tilesets/${this.tilesetId}.json`)
    },
    computed: {
      ...mapState(['env']),
    },
  }
</script>

<style>

.tileset-inspect-tabs .v-slide-group__wrapper{
  overflow-y: auto;
}

</style>
