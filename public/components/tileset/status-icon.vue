<i18n lang="yaml">
fr:
  tooltip-error: Une erreur a eu lieu pendant l'importation
  tooltip-pending: Une tache d'importation est en attente
  tooltip-importing: Une tache d'importation est en cours
  tooltip-done: Le tileset est à jour
en:
  tooltip-error: An error has occured
  tooltip-pending: An import task is pending
  tooltip-importing: An import task is running
  tooltip-done: Tileset is up to date
</i18n>

<template>
  <v-tooltip v-if="value.lastImport && value.lastImport.status" bottom>
    <template #activator="{ on }">
      <v-icon
        class="mx-1"
        :color="{
          'done': 'green',
          'error': 'error',
          'pending': 'blue',
          'importing': 'yellow darken-2',
        }[value.lastImport.status]"
        @click="$emit('click')"
        v-on="on"
        v-text="{
          'done': 'mdi-checkbox-marked-circle',
          'error': 'mdi-close-circle',
          'pending': 'mdi-record-circle',
          'importing': 'mdi-swap-horizontal-circle',
        }[value.lastImport.status]"
      />
    </template>
    <span v-text="$t('tooltip-'+value.lastImport.status)" />
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
