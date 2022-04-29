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
            :field="getSuggestionDisplay"
            :minLength="3"
            placeholder="Search loaded genes..."
          />
        </div>
      </div>
    </template>
    <div class="gene-data">

      <template v-if="searchedGene && showSearch">
        <div class="searched-gene-divider">Searched Gene</div>
        <div>
          Symbol:
          <Button
            class="p-button-link rgd-link"
            @click="goToRgd(searchedGene?.rgdId || -1)"
          >
            <b>{{searchedGene.symbol}}</b>
            <i class="pi pi-link external-link"></i>
          </Button>
        </div>
        <div>Name: {{searchedGene.name}}</div>
        <div>Chromosome: {{searchedGene.chromosome}}</div>
        <div>Region: {{Formatter.addCommasToBasePair(searchedGene.start)}} - {{Formatter.addCommasToBasePair(searchedGene.stop)}}</div>
        <Divider><b>Highlighted Sections</b></Divider>
      </template>

      <template v-for="dataObject in props.selectedData" :key="dataObject">
        <template v-if="dataObject?.type === 'trackSection'">
          <div v-if="dataObject.genomicSection.gene" data-test="gene-symbol">
            Symbol:
            <Button
              class="p-button-link rgd-link"
              @click="goToRgd(dataObject.genomicSection.gene.rgdId)"
            >
              <b>{{dataObject.genomicSection.gene.symbol}}</b>
              <i class="pi pi-link external-link"></i>
            </Button>
          </div>
          <div v-if="dataObject.genomicSection.gene" data-test="gene-name">Name: {{dataObject.genomicSection.gene.name ?? 'N/A'}}</div>
          <div data-test="chromosome-name">Chromosome: {{dataObject.genomicSection.chromosome}}</div>
          <div data-test="start-stop">Region: {{dataObject.genomicSection.regionLabel}}</div>
          <div>Orientation: {{dataObject.genomicSection.isInverted ? '-' : '+'}}</div>
          <div v-if="dataObject.genomicSection.chainLevel != null" data-test="level">Level: {{dataObject.genomicSection.chainLevel}}</div>
          <Divider />
        </template>

        <template v-else-if="dataObject?.type === 'geneLabel'">
          <div v-if="dataObject.genomicSection.gene">
            <div data-test="gene-symbol">
              Symbol:
              <Button
                class="p-button-link rgd-link"
                @click="goToRgd(dataObject.genomicSection.gene.rgdId)"
              >
                <b>{{dataObject.genomicSection.gene.symbol}}</b>
                <i class="pi pi-link external-link"></i>
              </Button>
            </div>
            <div data-test="gene-name">Name: {{dataObject.genomicSection.gene.name ?? 'N/A'}}</div>
            <div data-test="chromosome-name">Chromosome: {{dataObject.genomicSection.chromosome}}</div>
            <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(dataObject.genomicSection.gene.start)}} - {{Formatter.addCommasToBasePair(dataObject.genomicSection.gene.stop)}}</div>
            <Divider />


            <template v-for="gene in dataObject.genomicSection?.combinedGenes" :key="gene">
              <div data-test="gene-symbol">
                Symbol:
                <Button
                  class="p-button-link rgd-link"
                  @click="goToRgd(gene.gene.rgdId)"
                >
                  <b>{{gene.gene.symbol}}</b>
                  <i class="pi pi-link external-link"></i>
                </Button></div>
              <div data-test="gene-name"> Name: {{gene.gene.name ?? 'N/A'}}</div>
              <div data-test="chromosome-name">Chromosome: {{gene.gene.chromosome}}</div>
              <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(gene.gene.start)}} - {{Formatter.addCommasToBasePair(gene.gene.stop)}}</div>
              <Divider />
            </template>
          </div>
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
import { Formatter } from '@/utils/Formatter';
import { ref } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';

const store = useStore(key);

interface Props
{
  selectedData: SelectedData[] | null;
}

const props = defineProps<Props>();

const searchedGene = ref<Gene | null>(null);
const geneSuggestions = ref<Gene[]>([]);
const showSearch = ref<boolean>(false);

// fraction of gene bp length to add to the window when jumping
// to the gene after a search
const SEARCHED_GENE_WINDOW_FACTOR = 2;

const clearSelectedGenes = () => {
  store.dispatch('setSelectedGeneIds', []);
  store.dispatch('setSelectedData', null);
  store.dispatch('setGene', null);
  searchedGene.value = null;
  showSearch.value = false;
};

const searchGene = (event: {query: string}) => {
  showSearch.value = false;
  const loadedGenes = store.state.loadedGenes;
  let matches: Gene[] = loadedGenes.filter((gene) => gene.symbol.toLowerCase().includes(event.query.toLowerCase()));
  geneSuggestions.value = matches;
};

const searchSVG = (event: any) => {
  store.dispatch('setGene', event.value);
  store.dispatch('setSelectedGeneIds', [event.value?.rgdId] || []);
  // Only adjust window of the searched gene is on backbone
  if (event.value && event.value.speciesName === store.state.species?.name) {
    adjustSelectionWindow();
  }
  showSearch.value = true;
};

const goToRgd = (rgdId: number) => {
  const rgdUrl = `https://rgd.mcw.edu/rgdweb/report/gene/main.html?id=${rgdId}`;
  window.open(rgdUrl);
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

.rgd-link
{
  padding: 0;
}

.external-link
{
  padding-left: 4px;
}

.selected-data-header
{
  flex-direction: column;
}

.panel-header-item
{
  padding-bottom: 10px;
}

.searched-gene-divider
{
  padding-bottom: 1rem;
  font-weight: bold;
}
</style>
