<template>
  <v-dialog max-width="600">
    <template #activator="{on:dialog,attrs}">
      <v-tooltip bottom>
        <template #activator="{ on:tooltip }">
          <v-icon
            class="mx-1"
            v-bind="attrs"
            v-on="{...dialog,...tooltip}"
            v-text="'mdi-upload'"
          />
        </template>
        <span>
          Import MBTiles
        </span>
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
        const reader = new FileReader()
        reader.onload = async() => {
          await this.$axios.$post(this.env.publicUrl + '/api/tilesets', reader.result, { headers: { 'Content-type': 'application/octet-stream' } })

          this.$emit('change')
        }
        reader.readAsArrayBuffer(this.file)
      },
    },
  }
</script>

<style>

</style>
