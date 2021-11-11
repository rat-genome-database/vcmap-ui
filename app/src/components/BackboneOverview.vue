<template>
  <h6 class="display-6">Backbone</h6>
  <p v-if="backboneSpecies" class="backbone-label" data-test="backbone-overview-species">Species: {{backboneSpecies.name}}</p>
  <p class="backbone-label">Chromosome: 1</p>
  <p class="backbone-label">Base Pair Region: 50.65Kbp - 150.23Mbp</p>
</template>

<script lang="ts" setup>
import Species from '@/models/Species';
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

let backboneSpecies = ref<Species | null>(null);

onMounted(() => {
  backboneSpecies.value = store.getters.getSpecies;
});
</script>

<style lang="scss" scoped>
.backbone-label
{
  margin-top: 1rem;
}
</style>
