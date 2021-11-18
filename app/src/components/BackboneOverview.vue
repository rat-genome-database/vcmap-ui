<template>
  <div class="grid col-4">
    <div class="col-12">
      <h4>Backbone</h4>
      <div class="grid">
        <div class="col-6">
          <p class="backbone-field">Species:</p>
          <p class="backbone-field">Region:</p>
          <p class="backbone-field">Length:</p>
          <p class="backbone-field">Zoom Level:</p>
        </div>
        <div class="col-6">
          <p class="backbone-field backbone-value" data-test="backbone-overview-species">{{backboneSpecies?.name}}</p>
          <p class="backbone-field backbone-value">chr{{backboneChromosome?.chromosome}}:{{backboneStart}}-{{backboneStop}}</p>
          <p class="backbone-field backbone-value">{{backboneLengthLabel}}bp</p>
          <p class="backbone-field backbone-value">1x</p>
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
let backboneStart = ref<string | null>(null);
let backboneStop = ref<string | null>(null);
let backboneLengthLabel = ref<string | null>(null);

onMounted(() => {
  backboneSpecies.value = store.getters.getSpecies;
  backboneChromosome.value = store.getters.getChromosome;
  backboneStart.value = Formatter.addCommasToBasePair(store.getters.getStartPosition);
  backboneStop.value = Formatter.addCommasToBasePair(store.getters.getStopPosition);
  backboneLengthLabel.value = Formatter.addCommasToBasePair(store.getters.getStopPosition - store.getters.getStartPosition);
});
</script>

<style lang="scss" scoped>
.backbone-field
{
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  &.backbone-value
  {
    font-weight: bold;
  }
}
</style>
