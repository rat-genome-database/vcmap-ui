<template>
  <!-- Stubbed template w/ SVGs. We should split these out into our own components once we start using real data -->
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
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';

onMounted(() => {
  console.log('SVGViewBox mounted');
});

</script>

<style lang="scss" scoped>
rect.panel
{
  fill: white;
  stroke-width: 2;
  stroke: lightgray;
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
