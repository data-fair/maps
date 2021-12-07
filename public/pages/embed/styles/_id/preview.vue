<template>
  <page :style-id="styleId" embed />
</template>

<script>
  import page from '~/components/pages/style'
  export default {
    components: {
      page,
    },
    layout: 'embed',
    async asyncData({ params }) {
      return { styleId: params.id }
    },
  }
</script>

<style>

</style>
