<template>
  <v-snackbar
    v-if="event"
    v-model="showSnackbar"
    :color="event.type"
    :timeout="-1"
    top
    outlined
    elevation="5"
  >
    <v-row class="ma-0">
      <div>
        <p v-html="event.msg" />
        <p
          v-if="event.errorMsg"
          class="ml-3"
          v-html="event.errorMsg"
        />
      </div>
      <v-spacer />
      <v-btn
        icon
        @click.native="showSnackbar = false"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-row>
  </v-snackbar>
</template>

<script>
  import eventBus from '~/assets/event-bus'

  export default {
    data () {
      return {
        event: null,
        showSnackbar: false,
      }
    },
    computed: {
    },
    mounted () {
      eventBus.$on('error', async error => {
        this.showSnackbar = false
        await this.$nextTick()
        if (error) this.event = { type: 'error', msg: (error.response && (error.response.data || error.response.status)) || error.message || error }

        console.error(error)
        this.showSnackbar = true
      })
    },

  }
</script>

<style>

</style>
