<template>
  <div class="grid unpadded col-5">
    <div class="col-12">
      <h4>Overview</h4>
      <div class="grid unpadded">
        <div class="col-5">Displaying:</div>
        <div class="col-7 bold" data-test="backbone-overview-display">{{store.state.species?.name}} chr{{store.state.chromosome?.chromosome}}:{{formattedBackboneStart}}-{{formattedBackboneStop}}</div>
        <div class="col-5">Assembly:</div>
        <div class="col-7 bold">{{store.state.species?.activeMap.name}}</div>
        <div class="col-5">Length:</div>
        <div class="col-7 bold">{{backboneLength}}bp</div>
        <div class="col-5">Synteny Threshold:</div>
        <div class="col-7 bold">{{Formatter.addCommasToBasePair(store.state.overviewSyntenyThreshold)}}bp</div>
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
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Formatter } from '@/utils/Formatter';
import { computed } from 'vue';
import { useStore } from 'vuex';
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import { key } from '@/store';

const store = useStore(key);

const formattedBackboneStart = computed(() => {
  return Formatter.addCommasToBasePair(0);
});

const formattedBackboneStop = computed(() => {
  return (store.state.chromosome) ? Formatter.addCommasToBasePair(store.state.chromosome.seqLength) : '-';
});

const backboneLength = computed(() => {
  if (store.state.chromosome == null)
  {
    return '-';
  }

  return Formatter.addCommasToBasePair(store.state.chromosome.seqLength);
});

const selectionRange = computed(() => {
  let selectedRegion = store.state.selectedBackboneRegion;
  if (selectedRegion == null || (selectedRegion.baseSelection.basePairStop - selectedRegion.baseSelection.basePairStart <= 0))
  {
    return '-';
  }

  return `${Formatter.addCommasToBasePair(selectedRegion.baseSelection.basePairStart)}bp - ${Formatter.addCommasToBasePair(selectedRegion.baseSelection.basePairStop)}bp`;
});

const clearSelection = () => {
  store.dispatch('setSelectedBackboneRegion', new BackboneSelection(new SelectedRegion(0,0,0,0)));
  store.dispatch('setDetailedBasePairRange', { start: 0, stop: 0 });
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
