<i18n lang="yaml">
fr:
  import-json: Importer un style depuis un fichier json
  import-zip: Importer un style avec ses sprite depuis une archive zip

  label-id: Identifiant du nouveau style
  label-file-json: Ficher json
  label-file-zip: Archive zip

  warning: Etes-vous sur de vouloir remplacer ce style
  warning-bold: Cette action est irréversible

  button-cancel: Annuler
  button-import: Importer
  button-replace: Remplacer
en:
  import-json: Import a style from json file
  import-zip: Import style and sprite from zipped files

  label-id: Id of the new style
  label-file-json: Json file
  label-file-zip: Zipped files

  warning: Are you sure you want to replace this style
  warning-bold: This action cannot be undone

  button-cancel: Cancel
  button-import: Import
  button-replace: Replace
</i18n>

<template>
  <v-dialog max-width="600">
    <template #activator="{on:dialog,attrs}">
      <v-tooltip bottom>
        <template #activator="{ on:tooltip }">
          <v-icon
            v-if="format === 'json'"
            v-bind="attrs"
            class="mx-1"
            v-on="{...dialog,...tooltip}"
            v-text="'mdi-file-upload'"
          />
          <v-icon
            v-if="format === 'zip'"
            v-bind="attrs"
            class="mx-1"
            v-on="{...tooltip,...dialog}"
            v-text="'mdi-folder-upload'"
          />
        </template>
        <span v-if="format === 'json'" v-text="$t('import-json')" />
        <span v-if="format === 'zip'" v-text="$t('import-zip')" />
      </v-tooltip>
    </template>
    <template #default="dialog">
      <v-card>
        <v-card-title v-if="format === 'json'" v-text="$t('import-json')" />
        <v-card-title v-if="format === 'zip'" v-text="$t('import-zip')" />
        <v-card-text>
          <v-form v-model="valid">
            <v-text-field
              v-if="adminMode && newStyle"
              v-model="id"
              :rules="[v=>(!!(v || '').match(/^[a-z0-9A-Z\-\_]*$/) || 'Invalid character')]"
              :label="$t('label-id')"
            />
            <v-file-input
              v-model="file"
              :accept="format==='json'?'application/json':'.zip'"
              :rules="[v=>(!!v || 'File required')]"
              outlined
              dense
              :label="format==='json'?$t('label-file-json'):$t('label-file-zip')"
            />
          </v-form>
          <p v-if="!newStyle" v-text="$t('warning')" />
          <p v-if="!newStyle" v-text="$t('warning-bold')" />
          <v-card-actions class="justify-end">
            <v-btn
              color="error"
              @click="dialog.value=false"
              v-text="$t('button-cancel')"
            />
            <v-btn
              :disabled="!valid"
              color="success"
              @click="dialog.value=false;importStyle()"
              v-text="newStyle?(id ? `${$t('button-import')} / ${$t('button-replace')}` : $t('button-import')):$t('button-replace')"
            />
          </v-card-actions>
        </v-card-text>
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
  import eventBus from '~/assets/event-bus'
  import { mapState } from 'vuex'
  export default {
    props: {
      format: { type: String, default: 'json' },
      value: { type: Object, default: undefined },
    },
    data: () => ({
      valid: false,
      file: undefined,
      id: undefined,
    }),
    computed: {
      ...mapState(['env']),
      ...mapState(['session']),
      adminMode() {
        return this.session && this.session.user && this.session.user.adminMode
      },
      newStyle() {
        return !this.value
      },
      saveId() {
        return (this.value && this.value._id) || this.id
      },
    },
    async mounted() {
    },
    methods: {
      async importStyle() {
        if (!this.valid) return
        try {
          if (this.format === 'json') await this.importStyleJson()
          if (this.format === 'zip') await this.importStyleZip()

          this.$emit('change')
        } catch (error) {
          eventBus.$emit('error', error)
        }
      },
      async importStyleZip() {
        const formData = new FormData()
        formData.append('style.zip', this.file)
        if (!this.saveId) {
          await this.$axios.$post(this.env.publicUrl + '/api/styles', formData, {
            headers: 'multipart/form-data',
          })
        } else {
          await this.$axios.$put(this.env.publicUrl + '/api/styles/' + this.saveId, formData, {
            headers: 'multipart/form-data',
          })
        }
      },
      importStyleJson() {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = async() => {
            if (this.newStyle) {
              await this.$axios.$post(this.env.publicUrl + '/api/styles', JSON.parse(reader.result))
            } else {
              await this.$axios.$put(this.env.publicUrl + '/api/styles/' + this.value._id + '.json', JSON.parse(reader.result))
            }
            resolve()
          }
          try {
            reader.readAsText(this.file)
          } catch (error) {
            reject(error)
          }
        })
      },
    },
  }
</script>

<style>

</style>
