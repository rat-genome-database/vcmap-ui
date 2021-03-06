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
        <div class="col-7 bold"><span class="clickable-range" @click="openSelectionEditModal">{{selectionRange}}</span></div>
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
  <VCMapDialog v-model:show="showEditModal" header="Edit Base Selection Start/Stop Positions">
    <template #content>
      <div class="grid p-d-flex">
        <div class="col-6">
          <h4 class="config-label">Start Position</h4>
          <p class="label-description">Min: 0bp</p>
          <InputNumber
            showButtons
            v-model="startPosition"
            suffix="bp"
            :step="500"
            :max="maxPosition - 1"
            :min="0"
          />
        </div>
        <div class="col-6">
          <h4 class="config-label">Stop Position</h4>
          <p class="label-description">Max: {{Formatter.addCommasToBasePair(maxPosition)}}bp</p>
          <InputNumber
            showButtons
            v-model="stopPosition"
            suffix="bp"
            :step="500"
            :max="maxPosition"
            :min="1"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="grid p-d-flex">
        <div class="col-6 left-align-btn">
          <Button label="Cancel" class="p-button-primary" @click="closeModal" />
        </div>
        <div class="col-6">
          <Button label="Confirm New Selection" class="p-button-success" @click="saveSelectionChange" :disabled="!isValidStartStop || store.state.isOverviewPanelUpdating || store.state.isDetailedPanelUpdating" />
        </div>
      </div>
    </template>
  </VCMapDialog>
</template>

<script lang="ts" setup>
import { Formatter } from '@/utils/Formatter';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import VCMapDialog from './VCMapDialog.vue';

const store = useStore(key);

let showEditModal = ref(false);
let startPosition = ref(store.state.selectedBackboneRegion.baseSelection.basePairStart);
let stopPosition = ref(store.state.selectedBackboneRegion.baseSelection.basePairStop);

const areSelectionButtonsDisabled = computed(() => {
  return store.state.selectedBackboneRegion.baseSelection.svgHeight <= 0 
    || store.state.chromosome == null
    || store.state.isOverviewPanelUpdating 
    || store.state.isDetailedPanelUpdating;
});

const isValidStartStop = computed(() => {
  return startPosition.value !== stopPosition.value;
});

const maxPosition = computed(() => {
  return store.state.chromosome?.seqLength ?? 0;
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
  store.dispatch('clearBackboneSelection');
};

const changeSelectionByPercentage = (percent: number) => {
  if (store.state.chromosome == null)
  {
    console.error('Chromosome seq length required when adjusting backbone base selection');
    return;
  }

  const selectedBackboneRegion = store.state.selectedBackboneRegion;
  selectedBackboneRegion.adjustBaseSelectionByPercentage(percent, store.state.chromosome.seqLength, store.state.overviewBasePairToHeightRatio);
  store.dispatch('setBackboneSelection', selectedBackboneRegion);
};

const openSelectionEditModal = () => {
  startPosition.value = store.state.selectedBackboneRegion.baseSelection.basePairStart;
  stopPosition.value = store.state.selectedBackboneRegion.baseSelection.basePairStop;
  showEditModal.value = true;
};

const closeModal = () => {
  showEditModal.value = false;
};

const saveSelectionChange = () => {
  if (store.state.chromosome == null)
  {
    console.error('Chromosome seq length required when adjusting backbone base selection');
    return;
  }

  if (isValidStartStop.value)
  {
    const selectedBackboneRegion = store.state.selectedBackboneRegion;
    selectedBackboneRegion.adjustBaseSelectionByPosition(startPosition.value, stopPosition.value, store.state.chromosome?.seqLength, store.state.overviewBasePairToHeightRatio);
    store.dispatch('setBackboneSelection', selectedBackboneRegion);
  }
  showEditModal.value = false;
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

.clickable-range:hover
{
  color: var(--primary-color);
  cursor: pointer;
}

p.label-description
{
  margin: 0 0 0.5rem 0;
  font-style: italic;
}

.config-label
{
  margin-bottom: 0;
}

.left-align-btn
{
  text-align: left;
}
</style>
