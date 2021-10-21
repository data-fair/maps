<template>
  <v-dialog
    transition="dialog-bottom-transition"
    max-width="600"
    fullscreen
  >
    <template #activator="{ on }">
      <v-icon
        v-if="newStyle"

        v-on="on"
      >
        mdi-plus
      </v-icon>
      <v-icon
        v-else
        small
        class="mr-2"
        v-on="on"
      >
        mdi-pencil
      </v-icon>
    </template>
    <template #default="dialog">
      <v-card>
        <v-jsoneditor
          v-model="jsonStyle"
          :options="{
            onValidate:validate
          }"
        >
        <!--  -->
        </v-jsoneditor>
        <v-card-actions class="justify-end">
          <v-btn color="warning" @click="dialog.value=false">
            Cancel
          </v-btn>
          <v-btn
            color="success"
            :disabled="!valid"
            @click="dialog.value=false;save()"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
  import { mapState } from 'vuex'
  import VJsoneditor from 'v-jsoneditor'

  const maplibreStyle = require('@maplibre/maplibre-gl-style-spec')
  export default {

    components: {
      VJsoneditor,
    },
    props: {
      value: { type: Object, default: () => ({}) },
    },
    data () {
      return {
        jsonStyle: JSON.parse(JSON.stringify(this.value)),
      }
    },
    computed: {
      ...mapState(['env']),
      valid() {
        return this.validate(this.jsonStyle).length === 0
      },
      newStyle() {
        return !this.value._id
      },
    },
    methods: {
      validate(jsonStyle) {
        const errors = maplibreStyle.validate(JSON.parse(JSON.stringify(jsonStyle))).map(({ message }) => ({ path: [], message }))
        return errors
      },
      async save() {
        if (this.newStyle) {
          await this.$axios.$post(`${this.env.publicUrl}/api/styles`, this.jsonStyle)
        } else {
          await this.$axios.$put(`${this.env.publicUrl}/api/styles/${this.value._id}.json`, this.jsonStyle)
        }
        this.$emit('change')
      },
    },
  }
</script>

<style>

</style>
