<template>
  <div class="grid col-4">
    <div class="col-12">
      <h4>Backbone</h4>
      <p v-if="backboneSpecies" class="backbone-label" data-test="backbone-overview-species">Species: {{backboneSpecies.name}}</p>
      <p class="backbone-label">Chromosome: 1</p>
      <p class="backbone-label">Base Pair Region: 50.65Kbp - 150.23Mbp</p>
    </div>
  </div>
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
