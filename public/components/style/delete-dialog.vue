<i18n lang="yaml">
fr:
  title: Supprimer
  warning: Etes-vous sur de vouloir supprimer ce style
  warning-bold: Cette action est irréversible
  button-cancel: Annuler
  button-delete: Supprimer
en:
  title: Delete
  warning: Are you sure you want to delete this style
  warning-bold: This action cannot be undone
  button-cancel: Cancel
  button-delete: Delete
</i18n>

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
        v-text="'mdi-delete'"
      />
    </template>
    <template #default="dialog">
      <v-card>
        <v-card-title v-text="`${$t('title')} ${value.name}`" />
        <v-card-text>
          <p v-text="$t('warning')" />
          <p class="font-weight-bold" v-text="$t('warning-bold')" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn
            color="warning"
            @click="dialog.value = false"
            v-text="$t('button-cancel')"
          />
          <v-btn
            color="error"
            @click="dialog.value = false;deleteStyle()"
            v-text="$t('button-delete')"
          />
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
          await this.$axios.$delete(`${this.env.publicUrl}/api/styles/${this.value._id}`)
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
