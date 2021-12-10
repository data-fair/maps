<i18n lang="yaml">
fr:
  import-tileset: Importer un tileset depuis un fichier MBTiles
  import-tiles: Importer des tuiles depuis un fichier MBTiles

  title: Importer un fichier MBTiles

  label-id: Identifiant du nouveau tileset
  label-area: Zone
  label-file: Ficher MBTiles
  rule-file-required: Ficher requis
  rule-invalid-character: Caractère invalide

  button-cancel: Annuler
  button-import: Importer
en:
  import-tileset: Import Tileset from MBTiles
  import-tiles: Import tiles from MBTiles

  title: Import MBTiles

  label-id: Id of the new tileset
  label-area: Area
  label-file: MBTiles file
  rule-file-required: File required
  rule-invalid-character: Invalid character

  button-cancel: Cancel
  button-import: Import
</i18n>

<template>
  <v-dialog v-if="adminMode" max-width="600">
    <template #activator="{on:dialog,attrs}">
      <v-tooltip :bottom="icon" :left="!icon">
        <template #activator="{ on:tooltip }">
          <v-icon
            v-if="icon"
            class="mx-1"
            v-bind="attrs"
            v-on="{...dialog,...tooltip}"
            v-text="'mdi-upload'"
          />
          <v-list-item
            v-else
            v-bind="attrs"
            v-on="{...dialog,...tooltip}"
          >
            <v-list-item-icon>
              <v-icon color="primary" v-text="'mdi-upload'" />
            </v-list-item-icon>
            <v-list-item-title v-t="'title'" />
          </v-list-item>
        </template>
        <span v-if="newTileset" v-text="$t('import-tileset')" />
        <span v-else v-text="$t('import-tiles')" />
      </v-tooltip>
    </template>
    <template #default="dialog">
      <v-card>
        <v-card-title v-text="$t('title')" />
        <v-card-text>
          <v-form v-model="valid">
            <v-text-field
              v-if="adminMode && newTileset"
              v-model="id"
              :rules="[v=>(!!(v || '').match(/^[a-z0-9A-Z\-\_]*$/) || $t('rule-invalid-character'))]"
              :label="$t('label-id')"
            />
            <v-text-field
              v-model="area"
              :label="$t('label-area')"
            />
            <v-file-input
              v-model="file"
              accept=".mbtiles"
              :label="$t('label-file')"
              :rules="[v=>(!!v || $t('rule-file-required'))]"
              outlined
              dense
              counter
              show-size
            />
          </v-form>
          <v-card-actions>
            <v-btn
              color="error"
              @click="dialog.value=false"
              v-text="$t('button-cancel')"
            />
            <v-btn
              color="success"
              :disabled="!valid"
              @click="dialog.value=false;importMBTiles()"
              v-text="$t('button-import')"
            />
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
      icon: { type: Boolean, default: false },
    },
    data: () => ({
      id: undefined,
      valid: false,
      file: undefined,
      area: undefined,
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
        formData.append('area', this.area)
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
