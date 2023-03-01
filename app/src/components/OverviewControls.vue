<template>
  <div class="grid unpadded col-4">
    <div class="col-12">
      <h4>Overview</h4>
      <div class="grid unpadded">
        <div class="col-5">Base Selection:</div>
        <div class="col-7 bold" data-test="backbone-overview-display">{{store.state.species?.name}} chr{{store.state.chromosome?.chromosome}}:{{formattedBackboneStart}}-{{formattedBackboneStop}}</div>
        <div class="col-5">Assembly:</div>
        <div class="col-7 bold">{{store.state.species?.activeMap.name}}</div>
        <div class="col-5">Length:</div>
        <div class="col-7 bold">{{backboneLength}}bp</div>
        <div class="col-5">Synteny Threshold:</div>
        <div class="col-7 bold">{{Formatter.addCommasToBasePair(store.state.overviewSyntenyThreshold)}}bp</div>
        <div class="col-5">Displaying:</div>
        <div class="col-7 bold"><span class="clickable-range" @click="openSelectionEditModal">{{selectionRange}}</span></div>
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
            v-model="startPosition"
            :max="maxPosition - 1"
            :min="0"
            :useGrouping="false"
          />
          <div class="load-by-position-label">{{Formatter.addCommasToBasePair(startPosition)}}{{Formatter.evaluateBPInput(startPosition) !== null ? 'bp' : 'N/A'}}</div>
        </div>
        <div class="col-6">
          <h4 class="config-label">Stop Position</h4>
          <p class="label-description">Max: {{Formatter.addCommasToBasePair(maxPosition)}}bp</p>
          <InputNumber
            v-model="stopPosition"
            :max="maxPosition"
            :min="1"
            :useGrouping="false"
          />
          <div class="load-by-position-label">{{Formatter.addCommasToBasePair(stopPosition)}}{{stopPosition ? 'bp' : 'N/A'}}</div>
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
import { useLogger } from 'vue-logger-plugin';
import { key } from '@/store';
import VCMapDialog from './VCMapDialog.vue';

const store = useStore(key);
const $log = useLogger();

let showEditModal = ref(false);
let startPosition = ref(0);
let stopPosition = ref(store.state.chromosome.seqLength ?? 1);

const isValidStartStop = computed(() => {
  // Do we account for stop positions below start?
  // originally: return startPosition.value !== stopPosition.value;
  return startPosition.value < stopPosition.value;
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
  let chromosome = store.state.chromosome;

  if (selectedRegion)
  {
    return `${Formatter.addCommasToBasePair(selectedRegion.viewportSelection?.basePairStart ?? 0)}bp - ${Formatter.addCommasToBasePair(selectedRegion.viewportSelection?.basePairStop ?? chromosome.seqLength)}bp`;
  }
  else
  {
    return `${Formatter.addCommasToBasePair(0)}bp - ${Formatter.addCommasToBasePair(chromosome.seqLength)}bp`;
  }
});

const openSelectionEditModal = () => {
  startPosition.value = store.state.selectedBackboneRegion.viewportSelection.basePairStart;
  stopPosition.value = store.state.selectedBackboneRegion.viewportSelection.basePairStop;
  showEditModal.value = true;
};

const closeModal = () => {
  showEditModal.value = false;
};

const saveSelectionChange = () => {
  if (store.state.chromosome == null)
  {
    $log.error('Chromosome seq length required when adjusting backbone base selection');
    return;
  }

  if (isValidStartStop.value)
  {
    const selectedBackboneRegion = store.state.selectedBackboneRegion;
    selectedBackboneRegion.setViewportSelection(startPosition.value, stopPosition.value);
    store.dispatch('setDetailedBasePairRange', { start: startPosition.value, stop: stopPosition.value });
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

.load-by-position-label
{
  margin-top: 0.5em;
  font-weight: bold;
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
