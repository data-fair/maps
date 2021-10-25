<template>
  <v-container>
    <!-- :loading="$fetchState.pending" -->
    <v-card>
      <v-card-title>
        Render demo
        <v-spacer />
        <v-file-input
          v-model="file"
          counter
          outlined
          dense
          show-size
          :error="file===null"
        />
        <v-btn @click="$fetch">
          Render
        </v-btn>
        <v-btn @click="items=[]">
          Reset
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col
            v-for="i in items"
            :key="i"
            cols="4"
            md="3"
            lg="2"
            xl="1"
          >
            <v-card>
              <v-img :src="i">
                {{ i.length }}
              </v-img>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
  import wkx from 'wkx'
  import { mapState } from 'vuex'
  export default {
    data: () => ({
      items: [],
      file: undefined,
    }),
    async fetch() {
      if (!this.file) return
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          try {
            resolve(JSON.parse(reader.result).results)
          } catch (error) {
            reject(error)
          }
        }
        reader.readAsText(this.file)
      })
      const sourcesList = data.filter(j => j.trackEvents && j.trackEvents.length).map((journey) => {
        return {
          'journey-points': {
            type: 'MultiPoint',
            coordinates: (journey.trackEvents || []).filter((e) => e.gps && e.gps.lon).map(e => [e.gps.lon, e.gps.lat]),
          },
        }
      })
      this.items = sourcesList.map((sources) => {
        const dataSources = Object.keys(sources)
        return `${this.env.publicUrl}/api/render/default/500x500.${['png', 'jpg'].at(Math.random() * 2)}?wkb-sources=${dataSources.join(',')}&${dataSources.map(name => {
          return `${name}=${wkx.Geometry.parseGeoJSON(sources[name]).toWkb().toString('base64').split('+').join('-').split('/').join('_')}`
        }).join('&')}`
      })
    },
    computed: {
      ...mapState(['env']),
    },
  }
</script>

<style>

</style>
