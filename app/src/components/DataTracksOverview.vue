<template>
  <h6 class="display-6">Data Tracks</h6>
  <div v-for="track in dataTracks" class="row" :key="track.id">
    <div class="flex md-9">
      {{track.name}}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const dataTracks = ref([
  { id: 1, name: 'Clinical', color: 'blue' }
]);
</script>
