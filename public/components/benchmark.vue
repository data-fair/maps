<template>
  <v-card>
    <v-card-title>
      {{ title }}
      <v-spacer />
      <v-btn v-if="running" @click="avoidCache=undefined">
        Stop
      </v-btn>
      <v-btn v-else @click="avoidCache=`&avoid-cache=${Math.random()}`,start()">
        Start
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col class="col-12 col-lg-6 col-xl-4">
          <v-card-text>
            <span>Average milliseconds per render: {{ Math.round(dataUrls.filter(v=>!v.error).reduce((acc,v,index,array)=>acc+(v.time)/array.length,0)) }}ms</span>
          </v-card-text>
        </v-col>
        <v-col class="col-12 col-lg-6 col-xl-8" style="min-height:80vh;max-height:80vh;overflow:auto">
          <v-row class="flex-wrap-reverse">
            <v-col
              v-for="url in dataUrls"
              :key="url.originalUrl"
              cols="6"
              md="4"
              lg="2"
              xl="1"
            >
              <v-card>
                <v-img
                  :src="url.dataUrl"
                >
                  {{ url && url.time && (Math.round(url.time*1000)/1000 + 'ms') }}
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
        for (let index = 0; index < Math.min(this.urls.length, 144); index++) {
          if (!this.avoidCache) break
          if (promises.length > 4) {
            const endedUrlIndex = await Promise.race(promises.map(v => v.promise))
            promises.splice(promises.findIndex(v => v.urlIndex === endedUrlIndex), 1)
          }
          promises.push({
            urlIndex: index,
            promise: (async() => {
              let dataUrl
              let error
              let time
              try {
                const start = Date.now()
                const buffer = await this.$axios.$get(this.urls[index] + this.avoidCache, { responseType: 'arraybuffer' })
                time = Date.now() - start
                dataUrl = `data:image/png;charset=utf-8;base64,${Buffer.from(buffer).toString('base64')}`
              } catch (e) {
                error = e
              } finally {
                this.dataUrls.push({
                  dataUrl,
                  originalUrl: this.urls[index] + this.avoidCache,
                  error,
                  time,
                })
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
