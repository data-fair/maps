<i18n lang="yaml">
fr:
  autocomplete-label: Tileset

en:

  autocomplete-label: Tileset

</i18n>

<template>
  <v-row>
    <v-col>
      <v-text-field
        v-if="!edit"
        disabled
        outlined
        dense
        :value="value"
      />
      <v-autocomplete
        v-else
        v-model="autoItem"
        dense
        outlined
        :item-text="i=>i.name+' / '+i._id"
        item-value="_id"
        :items="items"
        :label="$t('autocomplete-label')"
        @input="$emit('input',env.publicUrl + '/api/tilesets/'+$event+'.json')"
      >
      <!--  -->
      </v-autocomplete>
    </v-col>
    <v-col class="col-1">
      <v-icon
        v-if="!edit"
        @click="old=value;autoItem=undefined;edit=true"
        v-text="'mdi-pencil'"
      />
      <v-icon
        v-else
        @click="$emit('input',old);edit=false"
        v-text="'mdi-close'"
      />
    </v-col>
  </v-row>
</template>

<script>
  import { mapState } from 'vuex'
  export default {
    props: {
      value: { type: String, default: '' },
      type: { type: String, default: '' },
    },
    data: () => ({
      edit: false,
      old: undefined,
      autoItem: undefined,
      items: [],
    }),
    async fetch() {
      this.items = (await this.$axios.$get(this.env.publicUrl + '/api/tilesets?size=50' + (this.type ? '&format=' + this.type : ''))).results
    },
    computed: {
      ...mapState(['env']),
    },
  }
</script>

<style>

</style>
