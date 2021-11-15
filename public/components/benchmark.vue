<template>
  <v-card>
    <v-card-title>
      {{ title }}
      <v-spacer />
      <v-btn v-if="running" @click="avoidCache=undefined">
        Reset
      </v-btn>
      <v-btn v-else @click="avoidCache=`&avoid-cache=${Math.random()}`,start()">
        Render
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col class="col-12 col-lg-6 col-xl-3">
        <!--  -->
        </v-col>
        <v-col class="col-12 col-lg-6 col-xl-9">
          <v-row v-if="avoidCache">
            <v-col
              v-for="url in dataUrls"
              :key="url"
            >
              <v-card>
                <v-img
                  :src="url"
                  width="40px"
                  :aspect-ratio="1"
                >
                  <!-- {{ url && url.length }} -->
                </v-img>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script>
  export default {
    props: {
      title: { type: String, default: '' },
      urls: { type: Array, default: () => [] },
    },
    data: () => ({
      dataUrls: [],
      avoidCache: undefined,
      running: false,
    }),
    methods: {
      async start() {
        this.running = true
        this.dataUrls = []
        const promises = []
        for (let index = 0; index < this.urls.length; index++) {
          if (!this.avoidCache) break
          if (promises.length > 10) {
            const endedUrlIndex = await Promise.race(promises.map(v => v.promise))
            promises.splice(promises.findIndex(v => v.urlIndex === endedUrlIndex), 1)
          }
          promises.push({
            urlIndex: index,
            promise: (async() => {
              try {
                const buffer = await this.$axios.$get(this.urls[index] + this.avoidCache, { responseType: 'arraybuffer' })
                const dataUrl = `data:image/png;charset=utf-8;base64,${Buffer.from(buffer).toString('base64')}`
                this.dataUrls.push(dataUrl)
              } finally {
                // eslint-disable-next-line no-unsafe-finally
                return index
              }
            })(),
          })
        }
        await Promise.all(promises.map(v => v.promise))
        this.running = false
      },
    },
  }
</script>

<style>

</style>
