<template>
  <page :tileset-id="tileset" />
</template>

<script>
  import page from '~/components/pages/tileset'
  export default {
    components: {
      page,
    },
    async asyncData({ params }) {
      return { tileset: params.id }
    },
  }
</script>

<style>

</style>
