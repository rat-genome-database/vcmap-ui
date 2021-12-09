<template>
  <div class="grid unpadded col-4">
    <div class="col-12">
      <h4>Backbone</h4>
      <div class="grid unpadded">
        <div class="col-5">Displaying:</div>
        <div class="col-7 bold" data-test="backbone-overview-display">{{backboneSpecies?.name}} chr{{backboneChromosome?.chromosome}}:{{backboneStart}}-{{backboneStop}}</div>
        <div class="col-5">Length:</div>
        <div class="col-7 bold">{{backboneLengthLabel}}bp</div>
        <div class="col-5">Zoom Level:</div>
        <div class="col-7 bold"><Zoom type="backbone"/></div>
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
import Zoom from '@/components/Zoom.vue';

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
.grid
{
  &.unpadded
  {
    padding: 0;
    div[class^="col-"]
    {
      padding-top: 0;
      padding-bottom: 0;
    }
  }

  div.bold
  {
    font-weight: bold;
  }
}
</style>
