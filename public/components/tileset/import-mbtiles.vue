<template>
  <v-dialog max-width="600">
    <template #activator="{on:dialog,attrs}">
      <v-tooltip bottom>
        <template #activator="{ on:tooltip }">
          <v-icon
            class="mx-1"
            v-bind="attrs"
            v-on="{...dialog,...tooltip}"
            v-text="newTileset?'mdi-plus':'mdi-upload'"
          />
        </template>
        <span v-if="newTileset" v-text="'Import Tileset from MBTiles'" />
        <span v-else v-text="'Import tiles from MBTiles'" />
      </v-tooltip>
    </template>
    <template #default="dialog">
      <v-card>
        <v-card-title>
          Import MBTiles
        </v-card-title>
        <v-card-text>
          <v-form v-model="valid">
            <v-text-field
              v-if="adminMode && newTileset"
              v-model="id"
              :rules="[v=>(!!(v || '').match(/^[a-z0-9A-Z\-\_]*$/) || 'Invalid character')]"
              label="Id of the new tileset"
            />
            <v-file-input
              v-model="file"
              accept=".mbtiles"
              label="MBTiles file to import"
              :rules="[v=>(!!v || 'File required')]"
              outlined
              dense
              counter
              show-size
            />
          </v-form>
          <v-card-actions>
            <v-btn color="error" @click="dialog.value=false">
              Cancel
            </v-btn>
            <v-btn
              color="success"
              :disabled="!valid"
              @click="dialog.value=false;importMBTiles()"
            >
              Import
            </v-btn>
          </v-card-actions>
        </v-card-text>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
  import { mapState } from 'vuex'
  export default {
    props: {
      value: { type: Object, default: undefined },
    },
    data: () => ({
      id: undefined,
      valid: false,
      file: undefined,
    }),
    computed: {
      ...mapState(['env']),
      ...mapState(['session']),
      adminMode() {
        return this.session && this.session.user && this.session.user.adminMode
      },
      saveId() {
        return (this.value && this.value._id) || this.id
      },
      newTileset() {
        return !this.value
      },
    },
    methods: {
      async importMBTiles() {
        const formData = new FormData()
        formData.append('tileset.mbtiles', this.file)
        if (!this.saveId) {
          await this.$axios.$post(this.env.publicUrl + '/api/tilesets', formData, { headers: 'multipart/form-data' })
        } else {
          if (this.newTileset) {
            await this.$axios.$put(this.env.publicUrl + '/api/tilesets/' + this.saveId, formData, { headers: 'multipart/form-data' })
          } else {
            await this.$axios.$patch(this.env.publicUrl + '/api/tilesets/' + this.saveId, formData, { headers: 'multipart/form-data' })
          }
        }

        this.$emit('change')
      },
    },
  }
</script>

<style>

</style>
