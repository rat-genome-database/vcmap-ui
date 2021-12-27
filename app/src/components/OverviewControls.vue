<template>
  <div class="grid unpadded col-5">
    <div class="col-12">
      <h4>Overview</h4>
      <div class="grid unpadded">
        <div class="col-5">Displaying:</div>
        <div class="col-7 bold" data-test="backbone-overview-display">{{backboneSpecies?.name}} chr{{backboneChromosome?.chromosome}}:{{displayBackboneStart}}-{{displayBackboneStop}}</div>
        <div class="col-5">Length:</div>
        <div class="col-7 bold">{{displayBackboneLength}}bp</div>
        <div class="col-5">Synteny Threshold:</div>
        <div class="col-7 bold">{{syntenyThreshold}}bp</div>
        <div class="col-5">Selection:</div>
        <div class="col-7 bold">
          <span>{{selectionRange}}</span>
          <Button 
            data-test="clear-selection-btn"
            v-tooltip.right="'Clear Selection'" 
            icon="pi pi-trash" 
            class="p-button-danger p-button-sm clear-btn" 
            @click="clearSelection"/>
        </div>
        <div class="col-5">Zoom Level:</div>
        <div class="col-7 bold"><Zoom type="backbone"/></div>
        <div class="col-5">Show Gaps:</div>
        <div class="col-7">
          <div class="p-field-checkbox">
            <Checkbox id="gaps" v-model="showGaps" :binary="true" @input="changeOverviewGaps" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Formatter } from '@/utils/Formatter';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import Zoom from '@/components/Zoom.vue';
import BackboneSelection from '@/models/BackboneSelection';

const store = useStore();

let showGaps = ref<boolean>(false);

onMounted(() => {
  showGaps.value = store.getters.getShowOverviewGaps;
});

const backboneSpecies = computed(() => {
  return store.getters.getSpecies;
});

const backboneChromosome = computed(() => {
  return store.getters.getChromosome;
});

const displayBackboneStart = computed(() => {
  return Formatter.addCommasToBasePair(store.getters.getDisplayStartPosition);
});

const displayBackboneStop = computed(() => {
  return Formatter.addCommasToBasePair(store.getters.getDisplayStopPosition);
});

const displayBackboneLength = computed(() => {
  return Formatter.addCommasToBasePair(store.getters.getDisplayStopPosition - store.getters.getDisplayStartPosition);
});

const selectionRange = computed(() => {
  let selectedRegion = store.getters.getSelectedBackboneRegion as BackboneSelection;
  if (selectedRegion == null || (selectedRegion.basePairStop - selectedRegion.basePairStart <= 0))
  {
    return '-';
  }

  return `${Formatter.addCommasToBasePair(selectedRegion.basePairStart)}bp - ${Formatter.addCommasToBasePair(selectedRegion.basePairStop)}bp`;
});

const syntenyThreshold = computed(() => {
  return store.getters.getOverviewSyntenyThreshold;
});

const clearSelection = () => {
  store.dispatch('setSelectedBackboneRegion', null);
};

const changeOverviewGaps = (val: boolean) => {
  store.dispatch('setShowOverviewGaps', val);
};
</script>

<style lang="scss" scoped>
.p-button.p-button-sm.clear-btn
{
  margin-left: 0.5rem;
  padding: 0.1rem;
  width: 1.5rem;
}

.gaps-label
{
  margin-right: 1rem;
}
</style>
