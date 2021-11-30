<i18n lang="yaml">
fr:
  icon-tooltip: Importer un style

  card-title: Importer un style

  label-zip: Importer des fichiers depuis un zip

  label-or: OU
  label-style-json: Fichier du style
  label-style-json-zipped: Fichier du style de l'archive zip
  label-sprite-json: Fichier json des sprites
  label-sprite-json-zipped: Fichier json des sprites de l'archive zip
  label-sprite-png: Fichier png des sprites
  label-sprite-png-zipped: Fichier png des sprites de l'archive zip
  label-id: Identifiant du nouveau style
  data-sources: Sources de données

  warning: Etes-vous sur de vouloir remplacer ce style
  warning-bold: Cette action est irréversible

  button-cancel: Annuler
  button-import: Importer
  button-replace: Remplacer
en:

  icon-tooltip: Import a style

  card-title: Import a style

  label-zip: Import files from a zip

  label-or: OR
  label-style-json: Style file
  label-style-json-zipped: Zipped style file
  label-sprite-json: sprite.json file
  label-sprite-json-zipped: Zipped sprite.json file
  label-sprite-png: sprite.png file
  label-sprite-png-zipped: Zipped sprite.png file
  data-sources: Data sources

  label-id: Id of the new style

  warning: Are you sure you want to replace this style
  warning-bold: This action cannot be undone

  button-cancel: Cancel
  button-import: Import
  button-replace: Replace
</i18n>

<template>
  <v-dialog max-width="800">
    <template #activator="{on:dialog,attrs}">
      <v-tooltip bottom>
        <template #activator="{ on:tooltip }">
          <v-icon
            v-bind="attrs"
            class="mx-1"
            v-on="{...dialog,...tooltip}"
            v-text="'mdi-file-upload'"
          />
        </template>
        <span v-text="$t('icon-tooltip')" />
      </v-tooltip>
    </template>
    <template #default="dialog">
      <v-card>
        <v-card-title>
          {{ $t('card-title') }}
          <v-spacer />
          <v-col cols="6">
            <v-file-input
              v-model="zip"
              accept=".zip"
              outlined
              dense
              :label="$t('label-zip')"
              @change="atZipInput"
            />
          </v-col>
        </v-card-title>
        <v-divider class="mb-4" />
        <v-card-text>
          <v-form>
            <v-row class="ma-0">
              <v-col v-if="!styleJsonZipped" cols="5">
                <v-file-input
                  v-model="styleJsonFile"
                  accept=".json"
                  outlined
                  dense
                  :label="$t('label-style-json')"
                  @change="atStyleInput"
                />
              </v-col>
              <span
                v-if="zip && !styleJsonFile && !styleJsonZipped"
                class="col-2 text-center"
                v-text="$t('label-or')"
              />
              <v-col v-if="zip && !styleJsonFile" cols="5">
                <v-select
                  v-model="styleJsonZipped"
                  :items="zippedJsonFiles"
                  outlined
                  dense
                  clearable
                  :label="$t('label-style-json-zipped')"
                  @change="atStyleInput"
                />
              </v-col>
            </v-row>
            <template v-if="styleJson && styleJson.sources && Object.keys(styleJson.sources).length">
              <h4 v-text="$t('data-sources')" />
              <v-row v-for="k in Object.keys(styleJson.sources)" :key="k">
                <v-col class="col-3">
                  {{ k }}
                </v-col>
                <v-col>
                  <select-tileset v-model="styleJson.sources[k].url" :type="styleJson.sources[k].type" />
                </v-col>
              </v-row>
            </template>
            <template v-if="styleJson && styleJson.sprite">
              <v-row class="ma-0">
                <v-col v-if="!spriteJsonZipped" cols="5">
                  <v-file-input
                    v-model="spriteJsonFile"
                    accept=".json"
                    outlined
                    dense
                    :label="$t('label-sprite-json')"
                  />
                </v-col>
                <span
                  v-if="zip && !spriteJsonFile && !spriteJsonZipped"
                  class="col-2 text-center"
                  v-text="$t('label-or')"
                />
                <v-col v-if="zip && !spriteJsonFile" cols="5">
                  <v-select
                    v-model="spriteJsonZipped"
                    :items="zippedJsonFiles"
                    outlined
                    dense
                    :label="$t('label-sprite-json-zipped')"
                  />
                </v-col>
              </v-row>
              <v-row class="ma-0">
                <v-col v-if="!spritePngZipped" cols="5">
                  <v-file-input
                    v-model="spritePngFile"
                    accept=".png"
                    outlined
                    dense
                    :label="$t('label-sprite-png')"
                  />
                </v-col>
                <span
                  v-if="zip && !spritePngFile && !spritePngZipped"
                  class="col-2 text-center"
                  v-text="$t('label-or')"
                />
                <v-col v-if="zip && !spritePngFile" cols="5">
                  <v-select
                    v-model="spritePngZipped"
                    :items="zippedPngFiles"
                    outlined
                    dense
                    :label="$t('label-sprite-png-zipped')"
                  />
                </v-col>
              </v-row>
            </template>
          </v-form>
          <p v-if="!newStyle" v-text="$t('warning')" />
          <p v-if="!newStyle" v-text="$t('warning-bold')" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-text-field
            v-if="adminMode && newStyle"
            v-model="id"
            :rules="[v=>(!!(v || '').match(/^[a-z0-9A-Z\-\_]*$/) || 'Invalid character')]"
            :label="$t('label-id')"
            class="mr-4 my-0"
          />
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
      </v-card>
    </template>
  </v-dialog>
</template>

<script>
  import selectTileset from '~/components/tileset/select.vue'
  import { unzip } from 'unzipit'
  import eventBus from '~/assets/event-bus'
  import { mapState } from 'vuex'
  export default {
    components: {
      selectTileset,
    },
    props: {
      value: { type: Object, default: undefined },
    },
    data: () => ({
      zip: undefined,
      zippedFilesEntries: {},

      styleJsonZipped: undefined,
      styleJsonFile: undefined,
      styleJson: undefined,

      spriteJsonZipped: undefined,
      spritePngZipped: undefined,
      spriteJsonFile: undefined,
      spritePngFile: undefined,

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
      zippedJsonFiles() {
        return this.zip ? Object.keys(this.zippedFilesEntries || {}).filter(n => n.endsWith('.json')) : []
      },
      zippedPngFiles() {
        return this.zip ? Object.keys(this.zippedFilesEntries || {}).filter(n => n.endsWith('.png')) : []
      },
      valid() {
        return this.styleJson && (!this.styleJson.sprite || ((this.spriteJsonZipped || this.spriteJsonFile) && (this.spritePngZipped || this.spritePngFile)))
      },
    },
    async mounted() {
    },
    methods: {
      async atZipInput() {
        this.styleJsonZipped = this.spriteJsonZipped = this.spritePngZipped = undefined
        this.atStyleInput()
        if (this.zip) {
          const reader = new FileReader()
          reader.onload = async (event) => {
            const { entries } = await unzip(event.target.result)
            this.zippedFilesEntries = entries
          }
          reader.readAsArrayBuffer(this.zip)
        }
      },
      async atStyleInput() {
        let string
        if (this.styleJsonZipped && this.zippedFilesEntries[this.styleJsonZipped]) {
          string = await this.zippedFilesEntries[this.styleJsonZipped].text()
        } else if (this.styleJsonFile) {
          string = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (event) => { resolve(event.target.result) }
            reader.readAsText(this.styleJsonFile)
          })
        }
        this.styleJson = string ? JSON.parse(string) : undefined
      },
      async importStyle() {
        if (!this.valid) return
        try {
          const formData = new FormData()
          formData.append('style.json', new Blob([JSON.stringify(this.styleJson)]), 'blob')

          if (this.styleJson.sprite) {
            if (this.spriteJsonFile) {
              formData.append('sprite.json', this.spriteJsonFile)
            } else {
              formData.append('sprite.json', await this.zippedFilesEntries[this.spriteJsonZipped].blob('application/json'))
            }
            if (this.spritePngFile) {
              formData.append('sprite.png', this.spritePngFile)
            } else {
              formData.append('sprite.png', await this.zippedFilesEntries[this.spritePngZipped].blob('image/png'))
            }
          }
          if (!this.saveId) {
            await this.$axios.$post(this.env.publicUrl + '/api/styles', formData, {
              headers: 'multipart/form-data',
            })
          } else {
            await this.$axios.$put(this.env.publicUrl + '/api/styles/' + this.saveId, formData, {
              headers: 'multipart/form-data',
            })
          }
          this.$emit('change')
        } catch (error) {
          eventBus.$emit('error', error)
        }
      },
    },
  }
</script>

<style>

</style>
