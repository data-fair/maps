<template>
  <v-container>
    <v-card
      elevation="5"
    >
      <v-card-title>
        Tilesets
        <v-spacer />
        <v-icon @click="$fetch" v-text="'mdi-refresh'" />
        <import-mbtiles @change="$fetch" />
      </v-card-title>
      <!-- <v-card-subtitle> -->
      <!--  -->
      <!-- </v-card-subtitle> -->
      <v-card-text>
        <!-- pagination.sync="pagination" -->
        <!-- hide-actions -->
        <v-data-table
          :headers="headers"
          :items="items"
          item-key="_id"
          :loading="$fetchState.pending"
          show-expand
          :options.sync="options"
          :server-items-length="itemCount"
          :footer-props="{'items-per-page-options':[5,10,20,50]}"
        >
          <template #item.format_icon="{item}">
            <v-icon v-if="item.format==='jpg'" v-text="'mdi-image'" />
            <v-icon v-if="item.format==='pbf'" v-text="'mdi-vector-square'" />
          </template>
          <!-- show-expand -->
          <template #expanded-item="{ item }">
            <td :colspan="headers.length" class="pa-0">
              <!-- More info about {{ item.name }} -->
              <v-simple-table tile dense>
                <thead>
                  <tr>
                    <th class="text-left">
                      Id
                    </th>
                    <th class="text-left">
                      Description
                    </th>
                    <th class="text-left">
                      Fields
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="layer in item.vector_layers"
                    :key="layer.id"
                  >
                    <td>{{ layer.id }}</td>
                    <td>{{ layer.description }}</td>
                    <td>{{ layer.fields }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </td>
          </template>
          <template #item.data-table-expand="{ expand, isExpanded, item }">
            <v-row class="justify-end">
              <v-icon
                v-if="item.vector_layers"
                class="mx-1"
                @click="expand(!isExpanded)"
                v-text="'mdi-layers-search'"
              />
              <import-mbtiles :value="item" @change="$fetch" />

              <!-- <v-icon
              small
              class="mr-2"
              @click="editItem(item)"
            >
              mdi-pencil
            </v-icon> -->
              <v-dialog
                transition="dialog-bottom-transition"
                max-width="600"
              >
                <template #activator="{ on }">
                  <v-icon
                    color="error"
                    class="mx-1"
                    v-on="on"
                  >
                    mdi-delete
                  </v-icon>
                </template>
                <template #default="dialog">
                  <v-card>
                    <v-card-title>
                      Delete {{ item.name }}
                    </v-card-title>
                    <v-card-text>
                      <p>Are you sure you want to delete this tileset</p>
                      <p class="font-weight-bold">
                        This action cannot be undone
                      </p>
                    </v-card-text>
                    <v-card-actions class="justify-end">
                      <v-btn
                        color="warning"
                        @click="dialog.value = false"
                      >
                        Cancel
                      </v-btn>
                      <v-btn
                        color="error"
                        @click="dialog.value = false;deleteTileset(item)"
                      >
                        Delete
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </template>
              </v-dialog>
            </v-row>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
  import importMbtiles from '~/components/tileset/import-mbtiles'
  import { mapState } from 'vuex'
  export default {
    components: {
      importMbtiles,
    },
    data: () => ({
      options: {},
      itemCount: undefined,
      headers: [
        { text: '', value: 'format_icon', sortable: false },
        { text: 'id', value: '_id' },
        { text: 'Name', value: 'name' },
        { text: 'Min Zoom', value: 'minzoom' },
        { text: 'Max Zoom', value: 'maxzoom' },
        { text: 'Tile format', value: 'format' },
        { text: 'Tile count', value: 'tileCount' },
        { text: 'Vector layer count', value: 'vector_layers.length' },
        { text: 'Actions', value: 'data-table-expand', sortable: false, width: '110px' },
      ],
      items: [],
    }),
    async fetch() {
      await this.$nextTick()
      const sort = ((this.options && this.options.sortBy && this.options.sortBy.length) ? `&sort=${this.options.sortBy.map((sort, index) => `${sort}:${this.options.sortDesc[index] ? -1 : 1}`)}` : '')
      const { results, count } = await this.$axios.$get(`${this.env.publicUrl}/api/tilesets?size=${this.options.itemsPerPage}&page=${this.options.page}` + sort)
      this.items = results
      this.itemCount = count
    },
    computed: {
      ...mapState(['env']),
    },
    watch: {
      options: {
        handler () {
          this.$fetch()
        },
        deep: true,
      },
    },
    async mounted() {
      await this.$fetch()
    },
    methods: {
      async deleteTileset(item) {
        await this.$axios.$delete(this.env.publicUrl + '/api/tilesets/' + item._id)
        await this.$fetch()
      },
    },
  }
</script>

<style>

</style>
