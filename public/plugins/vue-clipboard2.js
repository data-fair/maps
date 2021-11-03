import Vue from 'vue'
import VueClipboard from 'vue-clipboard2'

// documentation does not mention Vuetify, but this is needed for <v-dialog>...</v-dialog>
VueClipboard.config.autoSetContainer = true
Vue.use(VueClipboard)
