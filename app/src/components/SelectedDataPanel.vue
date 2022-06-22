<template>
  <Panel>
    <template #header>
      <div class="selected-data-header">
        <div class="panel-header-item">
          <b>Selected Data</b>
        </div>
        <div class="panel-header-item">
          <Button
            label="Clear Selection"
            class="p-button-info"
            @click="clearSelectedGenes"
          />
        </div>
        <div class="panel-header-item">
          <AutoComplete
            v-model="searchedGene"
            :suggestions="geneSuggestions"
            @complete="searchGene($event)"
            @item-select="searchSVG($event)"
            @keydown="selectAndSearchSVG($event)"
            :field="getSuggestionDisplay"
            :minLength="3"
            placeholder="Search loaded genes..."
          />
          <Button
            v-tooltip.right="`Only searches genes loaded in the selected overview \
              region (${Formatter.convertBasePairToLabel(overviewStart)} - \
              ${Formatter.convertBasePairToLabel(overviewStop)}). \
              Select a wider region on the backbone in the overview panel to search more genes.`"
            icon="pi pi-info-circle"
            class="p-button-link"
          >
          </Button>
        </div>
        <div class="panel-header-item">
          {{numberOfResults}} Selected Genes
        </div>
      </div>
    </template>
    <div class="gene-data">

      <template v-for="dataObject in props.selectedData" :key="dataObject">
        <template v-if="dataObject?.type === 'Gene'">
          <GeneInfo
            :gene="dataObject.genomicSection"
            :chromosome="dataObject.genomicSection.chromosome"
            :start="dataObject.genomicSection.start"
            :stop="dataObject.genomicSection.stop"
          />
          <Divider />
        </template>

        <template v-else-if="dataObject?.type === 'geneLabel' || dataObject?.type === 'trackSection'">
          <template v-if="dataObject?.type === 'trackSection'">
            <GeneInfo
              :gene="dataObject?.genomicSection.gene ? dataObject?.genomicSection.gene : null"
              :chromosome="dataObject.genomicSection.chromosome"
              :start="dataObject.genomicSection.sectionStart"
              :stop="dataObject.genomicSection.sectionStop"
              :chain-level="dataObject.genomicSection.chainLevel"
              :track-orientation="dataObject.genomicSection.isInverted ? '-' : '+'"
            />
          </template>
          <template v-else>
            <GeneInfo
              :gene="dataObject?.genomicSection.gene ? dataObject?.genomicSection.gene : null"
              :chromosome="dataObject.genomicSection.chromosome"
              :start="dataObject.genomicSection.sectionStart"
              :stop="dataObject.genomicSection.sectionStop"
            />
          </template>
          <Divider />

          <template v-if="dataObject.type === 'geneLabel'">
            <template v-if="(dataObject.genomicSection.combinedGenes && dataObject.genomicSection.combinedGenes.length > 0)">
              <template v-for="section in dataObject?.genomicSection.combinedGenes" :key="section">
                <GeneInfo
                  :gene="section.gene"
                  :chromosome="section.gene.chromosome"
                  :start="section.gene.start"
                  :stop="section.gene.stop"
                />
                <Divider />
              </template>
            </template>
          </template>

          <template v-else-if="dataObject.type === 'trackSection'">
            <template v-if="(dataObject.genomicSection.hiddenGenes && dataObject.genomicSection.hiddenGenes.length > 0)">
              <template v-for="section in dataObject?.genomicSection.hiddenGenes" :key="section">
                <GeneInfo
                  :gene="section.gene"
                  :chromosome="section.gene.chromosome"
                  :start="section.gene.start"
                  :stop="section.gene.stop"
                />
                <Divider />
              </template>
            </template>
          </template>
        </template>

        <template v-else-if="dataObject?.type === 'orthologLine'">
          <div data-test="start-stop">BACKBONE GENE:</div>
          <div data-test="gene-symbol">Symbol: {{dataObject.genomicSection.backboneGene.gene.symbol}}</div>
          <div data-test="gene-name">Name:{{dataObject.genomicSection.backboneGene.gene.name ?? 'N/A'}}</div>
          <div data-test="chromosome-name">Chromosome: {{dataObject.genomicSection.backboneGene.gene.chromosome}}</div>
          <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(dataObject.genomicSection.backboneGene.gene.start)}} - {{Formatter.addCommasToBasePair(dataObject.genomicSection.backboneGene.gene.stop)}}</div>

          <div data-test="start-stop">&lt;---------------------------------------&gt;</div>

          <div data-test="start-stop">COMPARATIVE GENE HOMOLOG:</div>
          <div data-test="gene-symbol">Species: {{dataObject.genomicSection.comparativeGene.gene.speciesName}}</div>
          <div data-test="gene-symbol">Symbol: {{dataObject.genomicSection.comparativeGene.gene.symbol}}</div>
          <div data-test="gene-name">Name:{{dataObject.genomicSection.comparativeGene.gene.name ?? 'N/A'}}</div>
          <div data-test="chromosome-name">Chromosome: {{dataObject.genomicSection.comparativeGene.gene.chromosome}}</div>
          <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(dataObject.genomicSection.comparativeGene.gene.start)}} - {{Formatter.addCommasToBasePair(dataObject.genomicSection.comparativeGene.gene.stop)}}</div>
        </template>
      </template>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import SelectedData from '@/models/SelectedData';
import Gene from '@/models/Gene';
import GeneInfo from '@/components/GeneInfo.vue';
import { Formatter } from '@/utils/Formatter';
import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import { getGeneOrthologIds, getNewSelectedData, sortGeneList } from '@/utils/DataPanelHelpers';
import TrackSection from '@/models/TrackSection';

const store = useStore(key);

interface Props
{
  selectedData: SelectedData[] | null;
}

const props = defineProps<Props>();

const searchedGene = ref<Gene | null>(null);
const geneSuggestions = ref<Gene[]>([]);
const numberOfResults = ref<number>(0);
const overviewStart = ref<number>(store.state.selectedBackboneRegion.baseSelection.basePairStart);
const overviewStop = ref<number>(store.state.selectedBackboneRegion.baseSelection.basePairStop);

// fraction of gene bp length to add to the window when jumping
// to the gene after a search
const SEARCHED_GENE_WINDOW_FACTOR = 2;

watch(() => props.selectedData, () => {
  numberOfResults.value = 0;
  if (props.selectedData) {
    props.selectedData.forEach((dataObject) => {
      if (dataObject.type === 'trackSection' || dataObject.type === 'Gene' || dataObject.type === 'geneLabel') {
        if (dataObject.type === 'trackSection' && dataObject.genomicSection.gene) {
          numberOfResults.value += (dataObject.genomicSection.hiddenGenes.length + 1);
          if (dataObject.genomicSection.hiddenGenes.length > 0) sortGeneList(dataObject.genomicSection.hiddenGenes);
        }
        if (dataObject.type === 'geneLabel') {
          numberOfResults.value += (dataObject.genomicSection.combinedGenes.length + 1);
          if (dataObject.genomicSection.combinedGenes.length > 0) sortGeneList(dataObject.genomicSection.combinedGenes);
        }
        if (dataObject.type === 'Gene') {
          numberOfResults.value += 1;
        }
      }
    });
  }
});

watch(() => store.state.selectedBackboneRegion.baseSelection, () => {
  overviewStart.value = store.state.selectedBackboneRegion.baseSelection.basePairStart;
  overviewStop.value = store.state.selectedBackboneRegion.baseSelection.basePairStop;
})

const clearSelectedGenes = () => {
  store.dispatch('setSelectedGeneIds', []);
  store.dispatch('setSelectedData', null);
  store.dispatch('setGene', null);
  searchedGene.value = null;
};

const searchGene = (event: {query: string}) => {
  const loadedGenes = store.state.loadedGenes;
  let matches: Gene[] = loadedGenes.filter((gene) => gene.symbol.toLowerCase().includes(event.query.toLowerCase()));
  geneSuggestions.value = matches;
};

const searchSVG = (event: any) => {
  store.dispatch('setGene', event.value);
  const geneOrthologIds = getGeneOrthologIds(store, event.value) || [];
  const rgdIds: number[] = [event.value?.rgdId] || [];
  store.dispatch('setSelectedGeneIds', [...rgdIds, ...geneOrthologIds] || []);
  store.dispatch('setSelectedData', getNewSelectedData(store, event.value));
  // Only adjust window of the searched gene is on backbone
  if (event.value && event.value.speciesName === store.state.species?.name) {
    adjustSelectionWindow();
  }
};

const selectAndSearchSVG = (event: any) => {
  // If "Enter" is pressed, just search the first gene
  if (event.key === "Enter") {
    searchedGene.value = geneSuggestions.value[0];
    const geneOrthologIds = getGeneOrthologIds(store, searchedGene.value) || [];
    const rgdIds: number[] = [searchedGene.value?.rgdId] || [];
    store.dispatch('setGene', searchedGene.value);
    store.dispatch('setSelectedGeneIds', [...geneOrthologIds, ...rgdIds] || []);
    store.dispatch('setSelectedData', getNewSelectedData(store, searchedGene.value));
    if (searchedGene.value && searchedGene.value.speciesName === store.state.species?.name) {
      adjustSelectionWindow();
    }
  }
};

const getSuggestionDisplay = (item: any) => {
  return `${item.symbol} - ${item.speciesName}`;
};

const adjustSelectionWindow = () => {
  const selectedRegion = store.state.selectedBackboneRegion;
  const selectionStart = selectedRegion.innerSelection?.basePairStart || selectedRegion.baseSelection.basePairStart;
  const selectionStop = selectedRegion.innerSelection?.basePairStop || selectedRegion.baseSelection.basePairStop;
  // If gene is outside of current window, reset the new window range
  if (searchedGene.value && (selectionStart > searchedGene.value.start || selectionStop < searchedGene.value.stop)) {
    // New start and stop will be +/- some multiple of the gene's length (currently 2x)
    const geneBasePairLength = searchedGene.value.stop - searchedGene.value.start;
    // Take the max of new start position, and selected region's original start
    // to avoid jumping to outside of loaded region
    const newInnerStart = Math.max(Math.floor(searchedGene.value.start
      - SEARCHED_GENE_WINDOW_FACTOR * geneBasePairLength), selectedRegion.baseSelection.basePairStart);
    // Take min of new stop and selected regions original stop
    const newInnerStop = Math.min(Math.floor(searchedGene.value.stop
      + SEARCHED_GENE_WINDOW_FACTOR * geneBasePairLength), selectedRegion.baseSelection.basePairStop);
    store.dispatch('setDetailedBasePairRange', { start: newInnerStart, stop: newInnerStop});
  }
};
</script>

<style lang="scss" scoped>
.gene-data
{
  overflow-y: scroll;
  height: 550px;
}

.selected-data-header
{
  flex-direction: column;
}

.panel-header-item
{
  padding-bottom: 10px;
}
</style>
