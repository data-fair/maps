<template>
  <v-dialog max-width="600">
    <template #activator="{on}">
      <v-icon
        v-if="format === 'json'"
        class="mr-2"
        v-on="on"
        v-text="'mdi-file-upload-outline'"
      />
      <v-icon
        v-if="format === 'zip'"
        class="mr-2"
        v-on="on"
        v-text="'mdi-folder-upload-outline'"
      />
    </template>
    <template #default="dialog">
      <v-card>
        <v-card-title v-if="format === 'json'" v-text="'Import Style from json file'" />
        <v-card-title v-if="format === 'zip'" v-text="'Import Style and sprite from zipped files'" />
        <v-card-text>
          <v-form v-model="valid">
            <v-text-field
              v-if="adminMode && newStyle"
              v-model="id"
              :rules="[v=>(!!(v || '').match(/^[a-z0-9A-Z\-\_]*$/) || 'Invalid character')]"
              label="Id of the new style"
            />
            <v-file-input
              v-model="file"
              :accept="format==='json'?'application/json':'.zip'"
              :label="format==='json'?'Style json file':'Zipped files'"
              :rules="[v=>(!!v || 'File required')]"
              outlined
              dense
            />
          </v-form>
          <p v-if="!newStyle" v-text="'Are you sure you want to replace this existing style ?'" />
          <p v-if="!newStyle" v-text="'This action cannot be undone'" />
          <v-card-actions class="justify-end">
            <v-btn color="error" @click="dialog.value=false">
              Cancel
            </v-btn>
            <v-btn
              :disabled="!valid"
              color="success"
              @click="dialog.value=false;importStyle()"
              v-text="newStyle?(id ? 'Import / Replace' : 'Import'):'Replace'"
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
