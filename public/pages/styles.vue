<template>
  <v-container>
    <v-card :loading="$fetchState.pending">
      <v-card-title>
        Styles
        <v-spacer />
        <import-dialog format="json" @change="$fetch" />
        <import-dialog format="zip" @change="$fetch" />
        <!-- <edit-dialog @change="$fetch" /> -->
      </v-card-title>
      <v-card-text v-if="!$fetchState.pending">
        <v-row>
          <v-col
            v-for="item in items"
            :key="item._id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <v-card outlined>
              <v-img
                :src="item.preview"
                height="240"
                width="426"
              />
              <v-card-title class="pa-2" v-text="item.name" />
              <v-row class="ma-0 pa-0">
                <v-card-subtitle
                  class="px-2 py-0"
                  v-text="item._id"
                />
                <v-spacer />
                <v-card-actions class="justify-end">
                  <import-dialog
                    format="json"
                    :value="item"
                    @change="$fetch"
                  />
                  <import-dialog
                    format="zip"
                    :value="item"
                    @change="$fetch"
                  />
                  <edit-dialog :value="item.style" @change="$fetch" />
                  <delete-dialog :value="item.style" @change="$fetch" />
                </v-card-actions>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
  import editDialog from '~/components/style/edit-dialog'
  import deleteDialog from '~/components/style/delete-dialog'
  import importDialog from '~/components/style/import-dialog'

  import { mapState } from 'vuex'
  export default {
    components: {
      editDialog, deleteDialog, importDialog,
    },
    data: () => ({
      // headers: [
      //   { text: 'id', value: '_id' },
      //   { text: 'Name', value: 'name' },
      //   { text: 'Layer count', value: 'layers.length' },
      //   { text: 'Preview', value: 'preview', sortable: false },
      //   { text: 'Actions', value: 'actions', sortable: false },
      // ],
      items: [],
    }),
    async fetch() {
      this.items = (await this.$axios.$get(this.env.publicUrl + '/api/styles')).map(style => {
        if (style.center && style.zoom) {
          return {
          ...style,
          style,
          preview: `${this.env.publicUrl}/api/render/${style._id}/640x360.png?lon=${style.center[0]}&lat=${style.center[1]}&zoom=${style.zoom}`,
          }
        } else {
          return {
          ...style,
          style,
          preview: `${this.env.publicUrl}/api/render/${style._id}/640x360.png?lat=${0}&lon=${0}&zoom=${0}`,
          }
        }
      })
    },
    computed: {
      ...mapState(['env']),
    },
    async mounted() {
      await this.$fetch()
    },
  }
</script>

<style>

</style>
