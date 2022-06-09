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
        </div>
        <template v-if="showResultsNumber">
          <div class="panel-header-item">
            {{numberOfResults}} Selected Genes
          </div>
        </template>
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
          <GeneInfo
            :gene="dataObject?.genomicSection.gene"
            :chromosome="dataObject.genomicSection.chromosome"
            :start="dataObject.genomicSection.sectionStart"
            :stop="dataObject.genomicSection.sectionStop"
            :chain-level="dataObject.genomicSection.chainLevel"
            :is-inverted="dataObject.genomicSection.isInverted"
          />
          <Divider />

          <template v-if="dataObject.type === 'geneLabel'">
            <template v-if="(dataObject.genomicSection.combinedGenes && dataObject.genomicSection.combinedGenes.length > 0)">
              <template v-for="section in dataObject?.genomicSection.combinedGenes" :key="section">
                <GeneInfo
                  :gene="section.gene"
                  :chromosome="section.gene.chromose"
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

const store = useStore(key);

interface Props
{
  selectedData: SelectedData[] | null;
}

const props = defineProps<Props>();

const searchedGene = ref<Gene | null>(null);
const geneSuggestions = ref<Gene[]>([]);
const showResultsNumber = ref<boolean>(false);
const numberOfResults = ref<number>(0);

// fraction of gene bp length to add to the window when jumping
// to the gene after a search
const SEARCHED_GENE_WINDOW_FACTOR = 2;

watch(() => props.selectedData, () => {
  showResultsNumber.value = false;
  numberOfResults.value = 0;
  if (props.selectedData) {
    props.selectedData.forEach((dataObject) => {
      if (dataObject.type === 'trackSection' || dataObject.type === 'Gene' || dataObject.type === 'geneLabel') {
        showResultsNumber.value = true;
        if (dataObject.type === 'trackSection' && dataObject.genomicSection.gene) {
          numberOfResults.value += (dataObject.genomicSection.hiddenGenes.length + 1);
        }
        if (dataObject.type === 'geneLabel') {
          numberOfResults.value += (dataObject.genomicSection.combinedGenes.length + 1);
        }
        if (dataObject.type === 'Gene') {
          numberOfResults.value += 1;
        }
      }
    });
  }
});

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
  const geneOrthologIds = getGeneOrthologIds(event.value) || [];
  const rgdIds: number[] = [event.value?.rgdId] || [];
  store.dispatch('setSelectedGeneIds', [...rgdIds, ...geneOrthologIds] || []);
  updateSelectedData(event.value);
  // Only adjust window of the searched gene is on backbone
  if (event.value && event.value.speciesName === store.state.species?.name) {
    adjustSelectionWindow();
  }
};

const selectAndSearchSVG = (event: any) => {
  // If "Enter" is pressed, just search the first gene
  if (event.key === "Enter") {
    searchedGene.value = geneSuggestions.value[0];
    const geneOrthologIds = getGeneOrthologIds(searchedGene.value) || [];
    const rgdIds: number[] = [searchedGene.value?.rgdId] || [];
    store.dispatch('setGene', searchedGene.value);
    store.dispatch('setSelectedGeneIds', [...geneOrthologIds, ...rgdIds] || []);
    updateSelectedData(searchedGene.value);
    if (searchedGene.value && searchedGene.value.speciesName === store.state.species?.name) {
      adjustSelectionWindow();
    }
  }
};

const getSuggestionDisplay = (item: any) => {
  return `${item.symbol} - ${item.speciesName}`;
};

const getGeneOrthologIds = (gene: Gene) => {
  const geneOrthologs = store.state.selectedBackboneRegion.orthologData.get(gene.symbol);
  let geneOrthologIds: number[] = [];
  if (geneOrthologs) {
    geneOrthologIds = Object.keys(geneOrthologs).map((geneKey) => geneOrthologs[geneKey][0].geneRgdId);
  }
  return geneOrthologIds;
};

const updateSelectedData = (gene: Gene) => {
  console.log(gene);
  const geneOrthologs = store.state.selectedBackboneRegion.orthologData.get(gene.symbol);
  const selectedData = [new SelectedData(gene, 'Gene')];
  if (geneOrthologs) {
    let geneKeys = Object.keys(geneOrthologs);
    for (let i = 0; i < geneKeys.length; i++) {
      let ortholog = new Gene(geneOrthologs[geneKeys[i]][0]);
      selectedData.push(new SelectedData(ortholog, 'Gene'));
    }
  }
  store.dispatch('setSelectedData', selectedData);
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
