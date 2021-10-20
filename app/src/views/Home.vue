<template>
  <div class="row header">
    <div class="flex md12">
      <img alt="VCMap Logo" class="logo" src="../assets/images/vcmap_logo_v2.jpg">
    </div>
  </div>
  <div>
    <va-card square outlined color="background" class="comparative-summary">
      <div class="row">
        <div class="flex md10">
          <h5 class="display-5">Configuration</h5>
        </div>
        <div class="flex md2 right-aligned">
          <va-button :rounded="false">Load New Configuration</va-button>
        </div>
      </div>
      <va-divider />
      <div class="row">
        <div class="flex md4">
          <h6 class="display-6">Comparative Species</h6>
          <ul class="va-unordered">
            <li v-for="species in comparativeSpecies" :key="species.id">
              <p>{{species.name}}</p>
              <p class="species-description">{{species.syntenyString}}</p>
            </li>
          </ul>
        </div>
        <div class="flex md4">
          <h6 class="display-6">Backbone</h6>
          <p>Species: {{backboneSpecies.name}}</p>
        </div>
        <div class="flex md4">
          <h6 class="display-6">Data Tracks</h6>
          <div v-for="track in dataTracks" class="row" :key="track.id">
            <div class="flex md-9">
              {{track.name}}
            </div>
          </div>
        </div>
      </div>
    </va-card>
    <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
      <!-- Outside panel -->
      <rect class="panel" x="0" width="1000" height="1000" />
      <!-- Inner panels -->
      <rect class="panel" x="0" width="375" height="1000" />
      <rect class="panel" x="375" width="625" height="1000" />
      <!-- Title panels -->
      <rect class="panel" x="0" width="375" height="50" />
      <rect class="panel" x="375" width="625" height="50" />
      <!-- Labels -->
      <text class="label medium bold" x="240" y="25">Backbone</text>
      <text class="label small" x="250" y="40">Human</text>
      <text class="label small" x="150" y="40">Rat</text>
      <text class="label small" x="50" y="40">Horse</text>
      <text class="label medium bold" x="400" y="25">Comparative</text>

      <!-- Stub genome maps -->
      <!-- human -->
      <rect class="map chr1" x="250" y="100" width="30" height="575" />
      <!-- Rat -->
      <rect class="map chr3" x="150" y="100" width="30" height="175" />
      <rect class="map chr4" x="150" y="320" width="30" height="145" />
      <!-- horse -->
      <rect class="map chr2" x="50" y="120" width="30" height="90" />
      <rect class="map chr3" x="50" y="240" width="30" height="170" />
      <rect class="map chr4" x="50" y="435" width="30" height="65" />
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  setup() {
    const comparativeSpecies = ref([
      { id: 1, name: 'Rattus Norvegicus', syntenyString: 'Synteny in chr1, chr4, chr11' },
      { id: 2, name: 'Equus Caballus', syntenyString: 'Synteny in chr2, chr7' }
    ]);

    const backboneSpecies = ref({
      name: 'Homo Sapiens',
      id: 3
    });

    const dataTracks = ref([
      { id: 1, name: 'Clinical', color: 'blue' }
    ]);

    return {
      comparativeSpecies,
      backboneSpecies,
      dataTracks
    };
  },
})
</script>


<style scoped>
.header.row
{
  padding: 0.5rem;
}

.row>.flex.right-aligned
{
  text-align: right;
}

.logo
{
  max-height: 100px;
}

rect.panel
{
  fill: white;
  stroke-width: 2;
  stroke: lightgray;
}

.va-card.comparative-summary
{
  padding: 0.75rem;
}

p.species-description
{
  margin-left: 0.25rem;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

.label.small
{
  font: normal 10px sans-serif;
}

.label.medium
{
  font: normal 13px sans-serif;
}

.label.bold
{
  font-style: bold;
}

.map
{
  stroke-width: 1;
  stroke: lightgray;
}

.map.chr1
{
  fill: lightgreen;
}

.map.chr2
{
  fill: burlywood;
}

.map.chr3
{
  fill: lightblue;
}

.map.chr4
{
  fill: lightsalmon;
}
</style>
