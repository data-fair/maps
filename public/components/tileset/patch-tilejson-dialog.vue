<i18n lang="yaml">
fr:
  title: Editer le TileJSON
  button-cancel: Annuler
  button-save: Sauvegarder
en:
  title: Edit TileJSON
  button-cancel: Cancel
  button-save: Save
</i18n>

<template>
  <v-dialog v-if="adminMode" max-width="600">
    <template #activator="{on:dialog,attrs}">
      <!-- <v-tooltip>
        <template #activator="{ on:tooltip }"> -->
      <v-icon
        class="mx-1"
        v-bind="attrs"
        v-on="{...dialog,...tooltip}"
        v-text="'mdi-pencil'"
      />
      <!-- </template>
        <span v-text="$t('icon-tooltip')" />
      </v-tooltip> -->
    </template>
    <template #default="dialog">
      <v-card>
        <v-card-title v-t="'title'" />
        <v-card-text>
          <v-form v-model="valid">
            <v-jsf v-model="tilejson_" :schema="schema" />
          </v-form>
          <v-card-actions>
            <v-btn
              v-t="'button-cancel'"
              color="error"
              @click="dialog.value=false"
            />
            <v-btn
              v-t="'button-save'"
              color="success"
              :disabled="!valid"
              @click="dialog.value=false;patch()"
            />
          </v-card-actions>
        </v-card-text>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
  import VJsf from '@koumoul/vjsf/lib/VJsf.js'
  import '@koumoul/vjsf/lib/VJsf.css'
  import { mapState } from 'vuex'
  import eventBus from '~/assets/event-bus'
  import schema from '~/../contracts/patch-tilejson'

  schema.properties.description['x-display'] = 'textarea'
  export default {
    components: {
      VJsf,
    },
    props: {
      tilejson: { type: Object, required: true },
    },
    data: () => ({
      tilejson_: {},
      valid: false,
      schema,
    }),
    computed: {
      ...mapState(['env']),
      ...mapState(['session']),
      adminMode() {
        return this.session && this.session.user && this.session.user.adminMode
      },
    },
    watch: {
      tilejson() {
        this.tilejson_ = this.tilejson
      },
    },
    async mounted() {
      this.tilejson_ = this.tilejson
    },
    methods: {
      async patch() {
        try {
          await this.$axios.$patch(this.env.publicUrl + '/api/tilesets/' + this.tilejson._id + '.json', this.tilejson_)
          this.$emit('change')
        } catch (error) {
          eventBus.$emit('error', error)
        }
      },
    },
  }
</script>

<style>

</style>
