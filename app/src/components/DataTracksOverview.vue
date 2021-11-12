<template>
  <div class="grid col-3">
    <div class="col-12">
      <h4>Data Tracks Loaded <span v-if="dataTracks">({{dataTracks.length}})</span></h4>
      <div class="data-tracks">
        <div v-for="track in dataTracks" class="grid" :key="track.id">
          <div class="col-3 track-color" :style="{ backgroundColor: track.color }">{{track.name}}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const dataTracks = ref([
  { id: 1, name: 'Clinical', color: 'lightseagreen' }
]);
</script>

<style lang="scss" scoped>
.data-tracks
{
  margin-top: 1rem;
}

.track-color
{
  color: white;
  font-weight: bold;
  border-radius: 1rem;
}
</style>
