<template>
  <page :style-id="styleId" />
</template>

<script>
  import page from '~/components/pages/style'
  export default {
    components: {
      page,
    },
    async asyncData({ params }) {
      return { styleId: params.id }
    },
  }
</script>

<style>

</style>
