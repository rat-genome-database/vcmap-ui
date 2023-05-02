<template>
  <div class="grid unpadded col-4">
    <div class="col-12">
      <h4>Overview</h4>
      <div class="grid unpadded">
        <div class="col-5">Backbone:</div>
        <div class="col-7 bold" data-test="backbone-overview-display">{{store.state.species?.name}} chr{{ store.state.chromosome?.chromosome }} ({{ store.state.species?.activeMap.name }})</div>
        <div class="col-5">Length:</div>
        <div class="col-7 bold">{{backboneLength}}bp</div>
        <div class="p-fluid col-12 bold">
          <Button 
            label="Edit BP Range"
            icon="pi pi-pencil"
            class="p-button-sm edit-bp-btn p-button-secondary"
            @click="openSelectionEditModal"
            >
          </Button>
        </div>
      </div>
    </div>
  </div>
  <VCMapDialog v-model:show="showEditModal" header="Edit Selected Start/Stop Positions">
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
          <Button label="Cancel" class="p-button-outlined p-button-secondary" @click="closeModal" />
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
let stopPosition = ref(store.state.chromosome?.seqLength ?? 1);

const isValidStartStop = computed(() => {
  // Do we account for stop positions below start?
  // originally: return startPosition.value !== stopPosition.value;
  return startPosition.value < stopPosition.value;
});

const maxPosition = computed(() => {
  return store.state.chromosome?.seqLength ?? 0;
});

const backboneLength = computed(() => {
  if (store.state.chromosome == null)
  {
    return '-';
  }

  return Formatter.addCommasToBasePair(store.state.chromosome.seqLength);
});

const openSelectionEditModal = () => {
  const defaultStart = 0;
  const defaultStop = store.state.chromosome?.seqLength ?? 0;

  startPosition.value = store.state.selectedBackboneRegion?.viewportSelection?.basePairStart ?? defaultStart;
  stopPosition.value = store.state.selectedBackboneRegion?.viewportSelection?.basePairStop ?? defaultStop;
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
    // FIXME: What is the point of setting the viewport selection here? See if we can remove these next couple lines.
    const selectedBackboneRegion = store.state.selectedBackboneRegion;
    selectedBackboneRegion?.setViewportSelection(startPosition.value, stopPosition.value);

    store.dispatch('setDetailedBasePairRequest', { start: startPosition.value, stop: stopPosition.value });
    // store.dispatch('setDetailedBasePairRange', { start: startPosition.value, stop: stopPosition.value });
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

.edit-bp-btn
{
  width: 10rem;
  margin-top: 0.5rem;
  height: 2rem;
}
</style>
