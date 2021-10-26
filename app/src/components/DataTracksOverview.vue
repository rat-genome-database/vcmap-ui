<template>
  <h6 class="display-6">Data Tracks</h6>
  <div v-for="track in dataTracks" class="row" :key="track.id">
    <div class="flex md-9">
      {{track.name}}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  setup() {
    const dataTracks = ref([
      { id: 1, name: 'Clinical', color: 'blue' }
    ]);

    return {
      dataTracks
    };
  },
})
</script>
