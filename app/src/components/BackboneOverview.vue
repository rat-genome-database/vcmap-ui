<template>
  <div>
    <h6 class="display-6">Backbone</h6>
    <p v-if="backboneSpecies" data-test="backbone-overview-species">Species: {{backboneSpecies.name}}</p>
  </div>
</template>

<script lang="ts" setup>
import Species from '@/models/Species';
import { onMounted, ref } from 'vue'
import { useStore } from 'vuex';

const store = useStore();

let backboneSpecies = ref<Species | null>(null);

onMounted(() => {
  console.log('mounted running', store.getters.getSpecies);
  backboneSpecies.value = store.getters.getSpecies;
});
</script>
