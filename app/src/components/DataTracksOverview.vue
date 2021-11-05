<template>
  <h6 class="display-6">Data Tracks</h6>
  <div class="data-tracks">
    <div v-for="track in dataTracks" class="row" :key="track.id">
      <div class="flex md3">{{track.name}}</div>
      <div class="flex md1 track-color"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const dataTracks = ref([
  { id: 1, name: 'Clinical', color: 'blue' }
]);
</script>

<style lang="scss">
.data-tracks
{
  margin-top: 1rem;
}

.track-color
{
  height: 1rem;
  width: 100%;
  background-color: darkgoldenrod;
  border-radius: 1rem;
}
</style>
