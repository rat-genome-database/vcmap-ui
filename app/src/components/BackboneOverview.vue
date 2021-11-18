<template>
  <div class="grid col-4">
    <div class="col-12">
      <h4>Backbone</h4>
      <div class="grid">
        <div class="col-6">
          <p class="backbone-label" data-test="backbone-overview-species">Species: {{backboneSpecies?.name}}</p>
          <p class="backbone-label">Chromosome: {{backboneChromosome?.chromosome}}</p>
          <p class="backbone-label">Base Pair Region: {{backboneStartLabel}} - {{backboneStopLabel}}</p>
        </div>
        <div class="col-6">
          <p class="backbone-label">Zoom Level: 1x</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Chromosome from '@/models/Chromosome';
import Species from '@/models/Species';
import { Formatter } from '@/utils/Formatter';
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

let backboneSpecies = ref<Species | null>(null);
let backboneChromosome = ref<Chromosome | null>(null);
let backboneStartLabel = ref<string | null>(null);
let backboneStopLabel = ref<string | null>(null);

onMounted(() => {
  backboneSpecies.value = store.getters.getSpecies;
  backboneChromosome.value = store.getters.getChromosome;
  backboneStartLabel.value = Formatter.convertBasePairToLabel(store.getters.getStartPosition);
  backboneStopLabel.value = Formatter.convertBasePairToLabel(store.getters.getStopPosition);
});
</script>

<style lang="scss" scoped>
.backbone-label
{
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
