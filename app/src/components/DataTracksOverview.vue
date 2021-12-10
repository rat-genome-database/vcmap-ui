<template>
  <div class="grid unpadded col-2">
    <div class="col-12">
      <h4>Data Tracks Loaded <span v-if="dataTracks">({{dataTracks.length}})</span></h4>
      <div class="data-tracks">
        <div v-for="track in dataTracks" class="grid" :key="track.id">
          <div class="col-3 track-color" :style="{ backgroundColor: track.color }">{{track.name}}</div>
        </div>
        <div v-if="dataTracks.length === 0">
          <p>No Data Tracks Loaded</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

interface DataTrack
{
  id?: number;
  name: string;
  color: string;
}

const dataTracks = ref<DataTrack[]>([]);
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

.grid.unpadded
{
  padding: 0;
  div[class^="col-"]
  {
    padding-top: 0;
    padding-bottom: 0;
  }
}
</style>
