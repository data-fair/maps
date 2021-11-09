<template>
  <v-container>
    <!-- :loading="$fetchState.pending" -->
    <v-card>
      <v-card-title>
        Render demo
        <v-spacer />
        <v-btn v-if="items.length" @click="items=[]">
          Reset
        </v-btn>
        <v-btn v-else @click="$fetch">
          Render
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
  import geoJsons from '~/assets/data-demo'
  import wkx from 'wkx'
  import { mapState } from 'vuex'
  export default {
    data: () => ({
      items: [],
    }),
    async fetch() {
      this.items = geoJsons.map((source) => {
        return `${this.env.publicUrl}/api/render/openmaptiles-maptiler-basic/500x500.${['png', 'jpg', 'jpeg', 'webp'].at(Math.random() * 4)}?wkb=${wkx.Geometry.parseGeoJSON(source).toWkb().toString('base64').split('+').join('-').split('/').join('_')}&wkb-type=line&wkb-width=5`
      })
    },
    computed: {
      ...mapState(['env']),
    },
  }
</script>

<style>

</style>
