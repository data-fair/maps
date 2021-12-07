<template>
  <page :tileset-id="tileset" embed />
</template>

<script>
  import page from '~/components/pages/tileset'
  export default {
    components: {
      page,
    },
    layout: 'embed',
    async asyncData({ params }) {
      return { tileset: params.id }
    },
  }
</script>

<style>

</style>
