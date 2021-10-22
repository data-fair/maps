<template>
  <v-dialog v-model="dialog" persistent>
    <template #activator="{on}">
      <v-btn v-on="on">
        Import MBTiles
        <v-icon>
          mdi-upload
        </v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title>
        Import MBTiles
      </v-card-title>
      <v-card-text>
        <v-file-input
          v-model="file"
          counter
          outlined
          dense
          show-size
          :error="file===null"
        />
        <v-card-actions>
          <v-btn color="error" @click="cancel">
            Cancel
          </v-btn>
          <v-btn
            color="success"
            :loading="uploading"
            :disabled="uploading"
            @click="upload"
          >
            Import
          </v-btn>
        </v-card-actions>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
  import { mapState } from 'vuex'
  export default {
    data: () => ({
      uploading: false,
      file: undefined,
      dialog: false,
      reader: new FileReader(),
    }),
    computed: {
      ...mapState(['env']),
    },
    async mounted() {
      this.reader.onprogress = console.log
      this.reader.onload = async() => {
        await this.$axios.$post(this.env.publicUrl + '/api/tiles', this.reader.result, { headers: { 'Content-type': 'application/octet-stream' } })
        this.uploading = false
        this.dialog = false
        this.file = undefined
        this.$emit('uploaded')
      }
    },
    methods: {
      async upload() {
        if (!this.file) {
          this.file = null
          return
        }
        try {
          this.uploading = true
          this.reader.readAsArrayBuffer(this.file)
        } catch (error) {
          console.error(error)
          this.uploading = false
        }
      },
      cancel() {
        this.uploading = false
        this.dialog = false
        this.file = undefined
      },
    },
  }
</script>

<style>

</style>
