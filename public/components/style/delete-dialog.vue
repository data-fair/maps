<template>
  <v-dialog
    transition="dialog-bottom-transition"
    max-width="600"
  >
    <template #activator="{ on }">
      <v-icon
        color="error"
        class="mx-1"
        v-on="on"
      >
        mdi-delete
      </v-icon>
    </template>
    <template #default="dialog">
      <v-card>
        <v-card-title>
          Delete {{ value.name }}
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete this style</p>
          <p class="font-weight-bold">
            This action cannot be undone
          </p>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn
            color="warning"
            @click="dialog.value = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="dialog.value = false;deleteStyle()"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
  import eventBus from '~/assets/event-bus'

  import { mapState } from 'vuex'
  export default {

    props: {
      value: { type: Object, default: () => ({}) },
    },
    computed: {
      ...mapState(['env']),
    },
    methods: {
      async deleteStyle() {
        try {
          await this.$axios.$delete(`${this.env.publicUrl}/api/styles/${this.value._id}.json`)
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
