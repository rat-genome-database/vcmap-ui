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
          <div v-if="dataObject.genomicSection">
            <div class="gene-row">
              <div>
                Symbol:
                <Button
                  class="p-button-link rgd-link"
                  @click="selectGene(dataObject.genomicSection)"
                >
                  <b>{{dataObject.genomicSection.symbol}}</b>
                </Button>
              </div>
              <div>
                <Button
                  class="p-button-link rgd-link"
                  @click="goToRgd(dataObject.genomicSection.rgdId)"
                >
                  <i class="pi pi-external-link external-link"></i>
                </Button>
              </div>
            </div>
          </div>
          <div data-test="gene-name">Name: {{dataObject.genomicSection.name ?? 'N/A'}}</div>
          <div data-test="chromosome-name">Chromosome: {{dataObject.genomicSection.chromosome}}</div>
          <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(dataObject.genomicSection.start)}} - {{Formatter.addCommasToBasePair(dataObject.genomicSection.stop)}}</div>
          <Divider />
        </template>

        <template v-else-if="dataObject?.type === 'geneLabel' || dataObject?.type === 'trackSection'">
          <div v-if="dataObject?.genomicSection.gene" data-test="gene-symbol">
            <div class="gene-row">
              <div>
                Symbol:
                <Button
                  class="p-button-link rgd-link"
                  @click="selectGene(dataObject.genomicSection.gene)"
                >
                  <b>{{dataObject.genomicSection.gene.symbol}}</b>
                </Button>
              </div>
              <div>
                <Button
                  class="p-button-link rgd-link"
                  @click="goToRgd(dataObject.genomicSection.gene.rgdId)"
                >
                  <i class="pi pi-external-link external-link"></i>
                </Button>
              </div>
            </div>
          </div>
          <div v-if="dataObject.genomicSection.gene" data-test="gene-name">Name: {{dataObject.genomicSection.gene.name ?? 'N/A'}}</div>
          <div data-test="chromosome-name">Chromosome: {{dataObject.genomicSection.chromosome}}</div>
          <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(dataObject.genomicSection.sectionStart)}} - {{Formatter.addCommasToBasePair(dataObject.genomicSection.sectionStop)}}</div>
          <div>Orientation: {{dataObject.genomicSection.isInverted ? '-' : '+'}}</div>
          <div v-if="dataObject.genomicSection.chainLevel != null" data-test="level">Level: {{dataObject.genomicSection.chainLevel}}</div>
          <Divider />

          <template v-if="dataObject.type === 'geneLabel'">
            <template v-if="(dataObject.genomicSection.combinedGenes && dataObject.genomicSection.combinedGenes.length > 0)">
              <template v-for="section in dataObject?.genomicSection.combinedGenes" :key="section">
                <div class="gene-row">
                  <div>
                    Symbol:
                    <Button
                      class="p-button-link rgd-link"
                      @click="selectGene(section.gene)"
                    >
                      <b>{{section.gene.symbol}}</b>
                    </Button>
                  </div>
                  <div>
                    <Button
                      class="p-button-link rgd-link"
                      @click="goToRgd(section.gene.rgdId)"
                    >
                      <i class="pi pi-external-link external-link"></i>
                    </Button>
                  </div>
                </div>
                <div data-test="gene-name"> Name: {{section.gene.name ?? 'N/A'}}</div>
                <div data-test="chromosome-name">Chromosome: {{section.gene.chromosome}}</div>
                <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(section.gene.start)}} - {{Formatter.addCommasToBasePair(section.gene.stop)}}</div>
                <Divider />
              </template>
            </template>
          </template>

          <template v-else-if="dataObject.type === 'trackSection'">
            <template v-if="(dataObject.genomicSection.hiddenGenes && dataObject.genomicSection.hiddenGenes.length > 0)">
              <template v-for="section in dataObject?.genomicSection.hiddenGenes" :key="section">
                <div class="gene-row" data-test="gene-symbol">
                  <div>
                    Symbol:
                    <Button
                      class="p-button-link rgd-link"
                      @click="selectGene(section.gene)"
                    >
                      <b>{{section.gene.symbol}}</b>
                    </Button>
                  </div>
                  <div>
                    <Button
                      class="p-button-link rgd-link"
                      @click="goToRgd(section.gene.rgdId)"
                    >
                      <i class="pi pi-external-link external-link"></i>
                    </Button>
                  </div>
                </div>
                <div data-test="gene-name"> Name: {{section.gene.name ?? 'N/A'}}</div>
                <div data-test="chromosome-name">Chromosome: {{section.gene.chromosome}}</div>
                <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(section.gene.start)}} - {{Formatter.addCommasToBasePair(section.gene.stop)}}</div>
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

const selectGene = (gene: Gene) => {
    const geneOrthologIds = getGeneOrthologIds(gene) || [];
    const rgdIds: number[] = [gene?.rgdId] || [];
    store.dispatch('setSelectedGeneIds', [...rgdIds, ...geneOrthologIds] || []);
    updateSelectedData(gene);
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

const goToRgd = (rgdId: number) => {
  const rgdUrl = `https://rgd.mcw.edu/rgdweb/report/gene/main.html?id=${rgdId}`;
  window.open(rgdUrl);
};

const getSuggestionDisplay = (item: any) => {
  return `${item.symbol} - ${item.speciesName}`;
};

const getGeneOrthologIds = (gene: Gene) => {
  const geneOrthologs = store.state.selectedBackboneRegion.orthologData.get(gene.symbol);
  let geneOrthologIds: number[];
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
.gene-row
{
  display: flex;
  justify-content: space-between;
}
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
