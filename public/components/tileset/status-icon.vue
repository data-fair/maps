<i18n lang="yaml">
fr:
  tooltip-error: Une erreur a eu lieu pendant l'importation
  tooltip-pending: Cette tache d'importation est en attente
  tooltip-working: Cette tache d'importation est en cours
  tooltip-done: Cette tache d'importation est terminée
en:
  tooltip-error: An error has occured
  tooltip-pending: This import task is pending
  tooltip-working: This import task is running
  tooltip-done: This import task has ended
</i18n>

<template>
  <v-tooltip v-if="value.status" bottom>
    <template #activator="{ on }">
      <v-icon
        class="mx-1"
        :color="{
          'done': 'green',
          'error': 'error',
          'pending': 'blue',
          'working': 'yellow darken-2',
        }[value.status]"
        @click="$emit('click')"
        v-on="on"
        v-text="{
          'done': 'mdi-checkbox-marked-circle',
          'error': 'mdi-close-circle',
          'pending': 'mdi-record-circle',
          'working': 'mdi-swap-horizontal-circle',
        }[value.status]"
      />
    </template>
    <span v-text="$t('tooltip-'+value.status)" />
  </v-tooltip>
</template>

<script>
  export default {
    props: {
      value: { type: Object, required: true },
    },
  }
</script>

<style>

</style>
