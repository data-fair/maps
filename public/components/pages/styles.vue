<i18n lang="yaml">
fr:
  title: Styles
  copy-url-tooltip: Copier l'adresse du style
en:
  title: Styles
  copy-url-tooltip: Copy style url to clipboard
</i18n>

<template>
  <v-container>
    <v-card :loading="$fetchState.pending">
      <v-card-title>
        {{ $t('title') }}
        <v-spacer />
        <import-dialog
          v-if="isAdmin"
          format="json"
          @change="$fetch"
        />
        <import-dialog
          v-if="isAdmin"
          format="zip"
          @change="$fetch"
        />
      </v-card-title>
      <v-card-text v-if="!$fetchState.pending">
        <v-row>
          <v-col
            v-for="item in items"
            :key="item._id"
            class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
          >
            <v-card outlined>
              <v-img
                :src="`${env.publicUrl}/api/render/${item._id}/640x360.png?lon=${item.center ? item.center[0] : 0}&lat=${item.center ? item.center[1] : 0}&zoom=${item.zoom || 0}`"
                height="240"
              />
              <v-card-title class="pa-2" v-text="item.name" />
              <v-row class="ma-0 pa-0">
                <v-card-subtitle
                  class="px-2 py-2"
                  v-text="item._id"
                />
                <v-spacer />
                <v-card-actions class="justify-end">
                  <copy-icon :value="`${env.publicUrl}/api/styles/${item._id}.json`" :label="$t('copy-url-tooltip')" />
                  <import-dialog
                    v-if="isAdmin"
                    format="json"
                    :value="item"
                    @change="$fetch"
                  />
                  <import-dialog
                    v-if="isAdmin"
                    format="zip"
                    :value="item"
                    @change="$fetch"
                  />
                  <edit-dialog
                    v-if="isAdmin"
                    :value="item"
                    @change="$fetch"
                  />
                  <delete-dialog
                    v-if="isAdmin"
                    :value="item"
                    @change="$fetch"
                  />
                </v-card-actions>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
        <v-pagination
          v-if="pageCount > 1"
          v-model="page"
          :length="pageCount"
          @input="$fetch"
        />
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
      page: 1,
      itemCount: undefined,
      items: [],
    }),
    async fetch() {
      const { results, count } = await this.$axios.$get(this.env.publicUrl + '/api/styles?size=12&page=' + this.page)
      this.items = results
      this.itemCount = count
    },
    computed: {
      pageCount() {
        return Math.ceil((this.itemCount || 0) / 12)
      },
      ...mapState(['env']),
      ...mapState(['session']),
      isAdmin() {
        return this.session && this.session.user && this.session.user.adminMode
      },
    },
    async mounted() {
      await this.$fetch()
    },
  }
</script>

<style>

</style>
