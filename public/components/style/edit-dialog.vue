<i18n lang="yaml">
fr:
  edit-tooltip: Éditer ce style
  button-cancel: Annuler
  button-save: Sauvegarder
en:
  edit-tooltip: Edit this style
  button-cancel: Cancel
  button-save: Save
</i18n>

<template>
  <v-dialog
    transition="dialog-bottom-transition"
    max-width="600"
    fullscreen
  >
    <template #activator="{ on:dialog,attrs }">
      <v-tooltip bottom>
        <template #activator="{ on:tooltip }">
          <v-icon
            v-bind="attrs"
            class="mx-1"
            v-on="{...dialog,...tooltip}"
            v-text="'mdi-pencil'"
          />
        </template>
        <span v-text="$t('edit-tooltip')" />
      </v-tooltip>
    </template>
    <template #default="dialog">
      <v-card>
        <v-jsoneditor v-model="jsonStyle" :options="{ onValidate: validate }" />
        <v-card-actions class="justify-end">
          <v-btn
            color="warning"
            @click="dialog.value=false"
            v-text="$t('button-cancel')"
          />
          <v-btn
            color="success"
            :disabled="!valid"
            @click="dialog.value=false;save()"
            v-text="$t('button-save')"
          />
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
  import { mapState } from 'vuex'
  import eventBus from '~/assets/event-bus'
  import VJsoneditor from 'v-jsoneditor'

  const maplibreStyle = require('@maplibre/maplibre-gl-style-spec')
  export default {
    components: {
      VJsoneditor,
    },
    props: {
      value: { type: Object, required: true },
    },
    data () {
      const jsonStyle = JSON.parse(JSON.stringify(this.value))
      delete jsonStyle._id
      return {
        jsonStyle,
      }
    },
    computed: {
      ...mapState(['env']),
      valid() {
        return this.validate(this.jsonStyle).length === 0
      },
    },
    methods: {
      validate(jsonStyle) {
        const errors = maplibreStyle.validate(JSON.parse(JSON.stringify(jsonStyle))).map(({ message }) => ({ path: [], message }))
        return errors
      },
      async save() {
        try {
          await this.$axios.$put(`${this.env.publicUrl}/api/styles/${this.value._id}.json`, this.jsonStyle)

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
