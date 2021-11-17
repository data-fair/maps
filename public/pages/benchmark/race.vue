<template>
  <v-container>
    <v-card>
      <v-card-title>
        Render speed comparator
        <v-spacer />
        <!-- <v-btn v-if="items.length" @click="items=[]">
          Reset
        </v-btn> -->
        <v-btn @click="start">
          Render
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col class="col-6">
            <v-card outlined>
              <v-card-title>
                Maps
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col
                    v-for="i in mapsImages"
                    :key="i.url"
                    cols="6"
                    md="4"
                    lg="2"
                    xl="1"
                  >
                    <v-card>
                      <v-img :src="i.dataUrl">
                        {{ i.url && i.url.length }}
                      </v-img>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col class="col-6">
            <v-card outlined>
              <v-card-title>
                Tileserver-gl
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col
                    v-for="i in tileserverImages"
                    :key="i.url"
                    cols="6"
                    md="4"
                    lg="2"
                    xl="1"
                  >
                    <v-card>
                      <v-img :src="i.dataUrl">
                        {{ i.url && i.url.length }}
                      </v-img>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
  import geoJSONs from '~/assets/data-demo.json'
  import wkx from 'wkx'
  import { mapState } from 'vuex'

  export default {
    layout: 'benchmark',
    data: () => ({
      mapsUrls: [],
      mapsImages: [],
      mapsTime: undefined,
      tileserverUrls: [],
      tileserverImages: [],
      tileserverTime: undefined,
      startTime: undefined,
    }),
    computed: {
          ...mapState(['env']),
    },
    async mounted() {
      const publicUrl = this.env.publicUrl
      // const publicUrl = 'https://staging-koumoul.com/maps'
      this.mapsUrls = geoJSONs.map((source) => {
        return `${publicUrl}/api/render/openmaptiles-maptiler-basic/500x500.png?wkb=${wkx.Geometry.parseGeoJSON(source).toWkb().toString('base64').split('+').join('-').split('/').join('_')}&wkb-type=line&wkb-width=5`
      })
      this.tileserverUrls = geoJSONs.map((source) => {
        return `https://staging-koumoul.com/s/tileserver/styles/osm-bright/static/auto/500x500.png?path=${source.coordinates.map((lonlat) => lonlat.join(',')).join('|')}&width=5`
      })
    },
    methods: {
      start() {
        this.startTime = new Date()
        this.renderMaps()
        this.renderTileserver()
      },
      async renderMaps() {
        if (!this.mapsUrls[this.mapsImages.length]) return (this.mapsTime = new Date())
        const url = this.mapsUrls[this.mapsImages.length] + '&no-cache=' + Math.random()
        try {
          const image = await this.$axios.$get(url, { responseType: 'arraybuffer' })
          const dataUrl = `data:image/png;charset=utf-8;base64,${Buffer.from(image).toString('base64')}`
          this.mapsImages.push({ url, dataUrl })
        } catch (error) {
          this.mapsImages.push({ error, url })
        }
        this.renderMaps()
      },
      async renderTileserver() {
        if (!this.tileserverUrls[this.tileserverImages.length]) return (this.tileserverTime = new Date())
        const url = this.tileserverUrls[this.tileserverImages.length] + '&no-cache=' + Math.random()
        try {
          const image = await this.$axios.$get(url, { responseType: 'arraybuffer' })
          const dataUrl = `data:image/png;charset=utf-8;base64,${Buffer.from(image).toString('base64')}`
          this.tileserverImages.push({ url, dataUrl })
        } catch (error) {
          this.tileserverImages.push({ error, url })
        }
        this.renderTileserver()
      },
    },
  }
</script>

<style>

</style>
