<template>
  <v-tooltip bottom>
    <template #activator="{ on }">
      <v-icon
        v-clipboard:copy="value"
        class="mx-1"
        v-on="on"
        @click=";"
      >
        mdi-content-copy
      </v-icon>
    </template>
    <span>Copy {{ label }} to clipboard</span>
  </v-tooltip>
</template>

<script>
  export default {
    props: {
      value: { type: String, required: true },
      label: { type: String, default: '' },
    },
  }
</script>

<style>

</style>
