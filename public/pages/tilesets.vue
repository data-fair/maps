<template>
  <v-container>
    <!-- outlined -->
    <v-card
      elevation="5"
    >
      <v-card-title>
        Tilesets
        <v-spacer />
        <import-mbtiles @uploaded="$fetch" />
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
        >
          <!-- show-expand -->
          <template #expanded-item="{ item }">
            <td :colspan="headers.length" class="pa-0">
              <!-- More info about {{ item.name }} -->
              <v-simple-table>
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
          <template #item.actions="{ item }">
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
                  small
                  color="error"
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
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
  import importMbtiles from '~/components/tilesets/import-mbtiles'
  import { mapState } from 'vuex'
  export default {
    components: {
      importMbtiles,
    },
    data: () => ({
      headers: [
        { text: 'id', value: '_id' },
        { text: 'Name', value: 'name' },
        { text: 'Min Zoom', value: 'minzoom' },
        { text: 'Max Zoom', value: 'maxzoom' },
        { text: 'Tile format', value: 'format' },
        { text: 'Tile count', value: 'tileCount' },
        { text: 'Vector layer count', value: 'vector_layers.length' },
        { text: 'Actions', value: 'actions', sortable: false },
        { text: 'Vector layers', value: 'data-table-expand', sortable: false },

      ],
      items: [],
    }),
    async fetch() {
      this.items = await this.$axios.$get(this.env.publicUrl + '/api/tilesets')
    },
    computed: {
      ...mapState(['env']),
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
