<template>
  <v-dialog max-width="600">
    <template #activator="{on}">
      <v-icon class="mr-2" v-on="on">
        mdi-upload
      </v-icon>
    </template>
    <template #default="dialog">
      <v-card>
        <v-card-title>
          {{ newStyle ? 'Import a Style file' : ('Replace style ' + value.name) }}
        </v-card-title>
        <v-card-text>
          <v-file-input
            v-model="file"
            outlined
            dense
            :error="file===null"
          />
          <p>Are you sure you want to replace this existing style</p>
          <p>This action cannot be undone</p>
          <v-card-actions class="justify-end">
            <v-btn color="error" @click="dialog.value=false">
              Cancel
            </v-btn>
            <v-btn :color="newStyle?'success':'warning'" @click="dialog.value=false;importStyle()">
              {{ newStyle ? 'Import' : 'Replace' }}
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
      file: undefined,
    }),
    computed: {
      ...mapState(['env']),
      newStyle() {
        return !(this.value !== undefined && this.value !== null && this.value._id)
      },
    },
    async mounted() {
    },
    methods: {
      async importStyle() {
        if (!this.file) {
          this.file = null
          return
        }
        const reader = new FileReader()
        reader.onload = async() => {
          if (this.newStyle) {
            await this.$axios.$post(this.env.publicUrl + '/api/styles', JSON.parse(reader.result))
          } else {
            await this.$axios.$put(this.env.publicUrl + '/api/styles/' + this.value._id, JSON.parse(reader.result))
          }
          this.$emit('change')
        }
        try {
          reader.readAsText(this.file)
        } catch (error) {
          console.error(error)
        }
      },
    },
  }
</script>

<style>

</style>
