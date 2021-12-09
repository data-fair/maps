<i18n lang="yaml">
fr:
  styles: Styles
  styles-description: "Un style de carte est une description complète d'un rendu de carte : couches de données, niveaux de zoom, couleurs, épaisseurs des traits, polices de caractères, etc. <br/>\
    Nos styles de carte sont présentés sour le format standard <a href=\"https://www.maplibre.org/maplibre-gl-js-docs/style-spec/\">maplibre style</a>."
  inspect-style: Voir
  tilesets: Tilesets
  tilesets-description: "Un Tileset est un ensemble de tuile regroupant des couches de données géographiques préparées pour être intégrées facilement dans une carte. <br/>\
    Nos Tilesets sont présentés sous le format standard des <a href=\"https://www.mapbox.com/vector-tiles/\">tuiles vectorielles</a> et intégrés dans nos styles de carte."
  inspect-tileset: Détails
en:
  styles: Styles
  styles-description: "A MapLibre style is a document that defines the visual appearance of a map: what data to draw, the order to draw it in, and how to style the data when drawing it. <br/>\
    Our styles are formated as describe by the <a href=\"https://www.maplibre.org/maplibre-gl-js-docs/style-spec/\">maplibre style</a>."
  inspect-style: View
  tilesets: Tilesets
  tilesets-description: " "
  inspect-tileset: Details
</i18n>

<template>
  <v-container>
    <v-card :loading="$fetchState.pending" flat>
      <v-card-title>
        Maps
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-card-title v-t="'styles'" />
            <v-card-text v-html="$t('styles-description')" />
          </v-col>
          <v-col
            v-for="style in (styles?.results || [])"
            :key="'style-'+style._id"
            class="col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3"
          >
            <v-card outlined>
              <v-card-title v-text="style.name" />
              <v-img
                :src="`${env.publicUrl}/api/render/${style._id}/640x360.png?lon=${style.center?.[0] || 0}&lat=${style.center?.[1] || 0}&zoom=${style.zoom || 0}`"
                :aspect-ratio="16/9"
              />
              <v-card-actions class="justify-end">
                <v-btn
                  v-t="'inspect-style'"
                  color="primary"
                  class="mx-1"
                  :to="{name:embed?'embed-styles-id-preview':'styles-id-preview',params:{id:style._id}}"
                  nuxt
                  text
                />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col cols="12">
            <v-card-actions class="justify-center">
              <v-btn
                v-t="'see-more'"
                :to="{name:embed?'embed-styles':'styles'}"
                style="width:33%"
                nuxt
                text
              />
            </v-card-actions>
          </v-col>
          <v-col cols="12">
            <v-card-title v-t="'tilesets'" />
            <v-card-text v-html="$t('tilesets-description')" />
          </v-col>
          <v-col
            v-for="tileset in (tilesets?.results || [])"
            :key="'tileset-'+tileset._id"
            class="col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3"
          >
            <v-card outlined>
              <v-card-title v-text="tileset.name" />
              <v-img
                :src="`${env.publicUrl}/api/tilesets/${tileset._id}/preview/640x360.png`"
                :aspect-ratio="16/9"
              />
              <v-card-actions class="justify-end">
                <v-btn
                  v-t="'inspect-tileset'"
                  color="primary"
                  class="mx-1"
                  :to="{name:embed?'embed-tilesets-id':'tilesets-id',params:{id:tileset._id}}"
                  nuxt
                  text
                />
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col cols="12">
            <v-card-actions class="justify-center">
              <v-btn
                v-t="'see-more'"
                :to="{name:embed?'embed-tilesets':'tilesets'}"
                style="width:33%"
                nuxt
                text
              />
            </v-card-actions>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
  import { mapState } from 'vuex'
  export default {
    components: {
    },
    props: {
      embed: { type: Boolean, default: false },
    },
    data: () => ({
      styles: undefined,
      tilesets: undefined,
    }),
    async fetch() {
      this.styles = await this.$axios.$get(this.env.publicUrl + '/api/styles?size=24')
      this.tilesets = await this.$axios.$get(this.env.publicUrl + '/api/tilesets?size=24')
    },
    computed: {
      ...mapState(['env']),
    },
  }
</script>

<style>

</style>
