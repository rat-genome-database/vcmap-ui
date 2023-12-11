<template>
  <div class="grid unpadded col-8">
    <div class="col-12">
      <h4 class="nav-text">Navigation</h4>
    </div>
    <div class="input-col">
      <div class="nav-input">
        <h5 class="search-title">Search and Select <i class="pi pi-info-circle info-icon" 
          v-tooltip="'Use the input below to search loaded gene data. Selecting an option will navigate you to the selected gene with its orthologs visible if possible. You can click the back button to return to your previous view after navigating.'"></i>
        </h5>
        <GeneSearch :geneList="props.geneList" :selectedData="props.selectedData" />
      </div>
      <div class="nav-input">
        <h5 class="history-title">Viewed Regions <i class="pi pi-info-circle info-icon" 
          v-tooltip="'Explore the history of viewed genomic regions. Select an entry to revisit that specific state. Note: Making a new config or switching the backbone will reset the history.'"></i>
        </h5>
        <HistoryPanel />
      </div>
    </div>
    <div class="zoom-col zoom-bar">
      <div class="bp-edit" @click="openSelectionEditModal">
        {{ displayedSpeciesRegionLabel }}
        <i class="pi pi-pencil edit-icon"></i>        
      </div>
      <Zoom />
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
    <div class="grid p-d-flex button-container">
        <div class="button-wrapper">
          <Button label="Cancel" class="p-button-outlined p-button-secondary" @click="closeModal" />
          <Button label="Confirm New Selection" class="p-button-success" @click="saveSelectionChange" :disabled="!isValidStartStop || store.state.isOverviewPanelUpdating || store.state.isDetailedPanelUpdating" />
        </div>
      </div>
  </template>
  </VCMapDialog>
</template>

<script lang="ts" setup>
import Gene from '@/models/Gene';
import SelectedData from '@/models/SelectedData';
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import Zoom from '@/components/Zoom.vue';
import GeneSearch from '@/components/GeneSearch.vue';
import VCMapDialog from './VCMapDialog.vue';
import HistoryPanel from '@/components/HistoryPanel.vue';
import { Formatter } from '@/utils/Formatter';
import { key } from '@/store';
import { useLogger } from 'vue-logger-plugin';

const store = useStore(key);
const $log = useLogger();

interface Props
{
  geneList: Map<number, Gene>;
  selectedData: SelectedData[] | null;
}

let showEditModal = ref(false);
let startPosition = ref(0);
let stopPosition = ref(store.state.chromosome?.seqLength ?? 1);

const props = defineProps<Props>();

const displayedSpeciesRegionLabel = computed(() => {
  const selectedRegion = store.state.selectedBackboneRegion;
  if (selectedRegion && selectedRegion.viewportSelection && selectedRegion.viewportSelection.svgHeight > 0)
  {
    return `${Formatter.addCommasToBasePair(selectedRegion.viewportSelection.basePairStart)}bp - ${Formatter.addCommasToBasePair(selectedRegion.viewportSelection.basePairStop)}bp`;
  }
  
  return '';
});

const maxPosition = computed(() => {
  return store.state.chromosome?.seqLength ?? 0;
});

const isValidStartStop = computed(() => {
  // Do we account for stop positions below start?
  // originally: return startPosition.value !== stopPosition.value;
  return startPosition.value < stopPosition.value;
});

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

    store.dispatch('setDetailedBasePairRequest', { range: {start: startPosition.value, stop: stopPosition.value}, source: 'Overview Edit' });
    // store.dispatch('setDetailedBasePairRange', { start: startPosition.value, stop: stopPosition.value });
  }
  showEditModal.value = false;
};

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
</script>

<style scoped>
.info-icon {
  position: relative;
  top: 0.05em; 
  margin-left: 0.5em; 
}

.left-align-btn {
  margin-right: 2em;
}
.search-title {
  margin-bottom: 0em;
  margin-top: 0em;
  font-size: .8em;
  
  .info-icon {
    font-size: 1.2em;
  }
}

.history-title {
  margin-bottom: 0em;
  margin-top: .5em;
  font-size: .8em;
  
  .info-icon {
    font-size: 1.2em;
  }
}

.nav-text {
  margin-bottom: 0em;
  margin-top: .5em;
}

.zoom-bar {
  margin-top: 1em;
  padding-right: 1em;
}

.input-col {
  flex: 0 0 30%; 
  max-width: 30%;
  
  .nav-input {
    position: relative;
    left: .5em;
  }
}

.zoom-col {
  flex: 0 0 70%; 
  max-width: 70%;
}

.bp-edit {
  align-items: center;
  justify-content: center;
  margin-left: 1em;
  display: flex;
  margin-bottom: 1em;
  font-size: .9em;
  font-weight: bold;
  cursor: pointer;
}

.edit-icon {
  color: var(--primary-color);
  margin-left: .5em;
}
</style>
