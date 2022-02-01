<template>
  <div class="grid unpadded col-4">
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
        <div class="col-5">Base Selection:</div>
        <div class="col-7 bold"><span>{{selectionRange}}</span></div>
        <div class="col-7 col-offset-5 selection-btn-row">
          <Button
            :disabled="areSelectionButtonsDisabled"
            v-tooltip.left="'Shrink Selection by 20%'" 
            icon="pi pi-fast-backward" 
            class="p-button-success p-button-sm selection-btn" 
            @click="changeSelectionByPercentage(-20)" />
          <Button
            :disabled="areSelectionButtonsDisabled"
            v-tooltip.left="'Shrink Selection by 10%'" 
            icon="pi pi-step-backward" 
            class="p-button-success p-button-sm selection-btn" 
            @click="changeSelectionByPercentage(-10)" />
          <Button
            :disabled="areSelectionButtonsDisabled"
            v-tooltip.left="'Expand Selection by 10%'" 
            icon="pi pi-step-forward" 
            class="p-button-success p-button-sm selection-btn" 
            @click="changeSelectionByPercentage(10)" />
          <Button
            :disabled="areSelectionButtonsDisabled"
            v-tooltip.left="'Expand Selection by 20%'" 
            icon="pi pi-fast-forward" 
            class="p-button-success p-button-sm selection-btn" 
            @click="changeSelectionByPercentage(20)" />
          <Button 
            data-test="clear-selection-btn"
            :disabled="areSelectionButtonsDisabled"
            v-tooltip.left="'Clear Selection'" 
            icon="pi pi-ban" 
            class="p-button-danger p-button-sm selection-btn" 
            @click="clearSelection" />
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

const areSelectionButtonsDisabled = computed(() => {
  return store.state.selectedBackboneRegion.baseSelection.svgHeight <= 0 || store.state.isOverviewPanelUpdating || store.state.isDetailedPanelUpdating;
});

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

const changeSelectionByPercentage = (percent: number) => {
  if (store.state.chromosome == null)
  {
    console.error('Chromosome seq length required when adjusting backbone base selection');
    return;
  }

  const selectedBackboneRegion = store.state.selectedBackboneRegion;
  selectedBackboneRegion.adjustBaseSelectionByPercentage(percent, store.state.chromosome.seqLength, store.state.overviewBasePairToHeightRatio);
  if (selectedBackboneRegion.innerSelection == null)
  {
    console.error('Cannot trigger detailed panel update if selected backbone region does not have an inner selection');
  }

  store.dispatch('setSelectedBackboneRegion', selectedBackboneRegion);
  store.dispatch('setDetailedBasePairRange', { start: selectedBackboneRegion.innerSelection?.basePairStart, stop: selectedBackboneRegion.innerSelection?.basePairStop });
};
</script>

<style lang="scss" scoped>
.p-button.p-button-sm.selection-btn
{
  margin-right: 0.5rem;
  padding: 0.1rem;
  width: 1.5rem;
}

.gaps-label
{
  margin-right: 1rem;
}

.selection-btn-row
{
  margin-top: 0.5rem;
}
</style>
