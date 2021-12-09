<template>
  <div>
    <v-btn
      v-if="$nuxt?.context?.from?.path !== $nuxt?.context?.route?.path"
      :to="$nuxt?.context?.from?.path"
      nuxt
      style="left:10px;top:10px;z-index:100"
      fab
      color="white"
      absolute
      elevation="2"
      top
      small
      left
    >
      <v-icon>
        mdi-close
      </v-icon>
    </v-btn>
    <maplibre
      :map-style="styleUrl"
      :style="'z-index:90;height:'+(embed?'100vh':'calc(100vh - 48px)')"
      width="100%"
      hash
    />
  </div>
</template>

<script>
  import maplibre from '~/components/maplibre'
  import { mapState } from 'vuex'
  export default {
    components: {
      maplibre,
    },
    props: {
      styleId: { type: String, required: true },
      embed: { type: Boolean, default: false },
    },
    computed: {
      ...mapState(['env']),
      styleUrl() {
        return `${this.env.publicUrl}/api/styles/${this.styleId}.json`
      },
    },
  }
</script>

<style>

</style>
