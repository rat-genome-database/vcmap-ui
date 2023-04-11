<template>
  <Panel>
    <template #header>
      <div class="selected-data-header">
        <div class="panel-header-item">
          <b>Selected Data</b>
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
        <div class="panel-header-item">
          <div v-if="numberOfResults > 0">
            {{numberOfResults}} Selected Genes
          </div>
          <div class="clear-selection-btn">
            <Button
                v-tooltip.right="`Clear Selection`"
                class="p-button-info p-button-sm"
                icon="pi pi-ban"
                @click="clearSelectedGenes"
                rounded
            />
          </div>
        </div>
      </div>
    </template>
    
    <div class="gene-data">
      <template v-if="!props.selectedData || props.selectedData.length === 0">
        <div class="no-data">
          <p class="placeholder-msg">No data selected</p>
          <p class="placeholder-msg-txt">Select data by clicking or hovering drawn elements, or searching by gene symbol above</p>
        </div>
      </template>
      <template v-for="dataObject in props.selectedData" :key="dataObject">
        <template v-if="dataObject?.type === 'Gene'">
          <GeneInfo
            :gene="dataObject.genomicSection.gene ? dataObject.genomicSection.gene : dataObject.genomicSection"
            :chromosome="dataObject.genomicSection.chromosome ? dataObject.genomicSection.chromosome : dataObject.genomicSection.gene.chromosome"
            :start="dataObject.genomicSection.speciesStart ? dataObject.genomicSection.speciesStart : dataObject.genomicSection.start"
            :stop="dataObject.genomicSection.speciesStop ? dataObject.genomicSection.speciesStop : dataObject.genomicSection.stop"
          />
          <Divider />
        </template>

        <template v-else-if="(dataObject?.type === 'geneLabel' || dataObject?.type === 'trackSection' || dataObject?.type === 'backbone')">
          <template v-if="(dataObject.type === 'trackSection')">
            <GeneInfo
              :gene="dataObject?.genomicSection.gene ? dataObject?.genomicSection.gene : null"
              :chromosome="dataObject.genomicSection.chromosome"
              :start="dataObject.genomicSection.speciesStart"
              :stop="dataObject.genomicSection.speciesStop"
              :chain-level="dataObject.genomicSection.chainLevel"
              :track-orientation="dataObject.genomicSection.isInverted ? '-' : '+'"
            />
          </template>
          <template v-else-if="(dataObject.type === 'backbone')">
            <GeneInfo
              :gene="null"
              :chromosome="dataObject.genomicSection.chromosome"
              :start="dataObject.genomicSection.windowStart"
              :stop="dataObject.genomicSection.windowStop"
              track-orientation="+"
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
          <div data-test="gene-symbol">Symbol: {{dataObject.genomicSection.backboneGene.symbol}}</div>
          <div data-test="gene-name">Name:{{dataObject.genomicSection.backboneGene.name ?? 'N/A'}}</div>
          <div data-test="chromosome-name">Chromosome: {{dataObject.genomicSection.backboneGene.chromosome}}</div>
          <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(dataObject.genomicSection.backboneGene.start)}} - {{Formatter.addCommasToBasePair(dataObject.genomicSection.backboneGene.stop)}}</div>

          <div data-test="start-stop">&lt;---------------------------------------&gt;</div>

          <div data-test="start-stop">COMPARATIVE GENE HOMOLOG:</div>
          <div data-test="gene-symbol">Species: {{dataObject.genomicSection.offBackboneGene.speciesName}}</div>
          <div data-test="gene-symbol">Symbol: {{dataObject.genomicSection.offBackboneGene.symbol}}</div>
          <div data-test="gene-name">Name:{{dataObject.genomicSection.offBackboneGene.name ?? 'N/A'}}</div>
          <div data-test="chromosome-name">Chromosome: {{dataObject.genomicSection.offBackboneGene.chromosome}}</div>
          <div data-test="start-stop">Region: {{Formatter.addCommasToBasePair(dataObject.genomicSection.offBackboneGene.start)}} - {{Formatter.addCommasToBasePair(dataObject.genomicSection.offBackboneGene.stop)}}</div>
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
import SVGConstants, {PANEL_SVG_START, PANEL_SVG_STOP} from '@/utils/SVGConstants';
import { ref, watch} from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import { getNewSelectedData, sortGeneList, sortGeneMatches } from '@/utils/DataPanelHelpers';

/**
 * FIXME: This whole component needs to be looked over. There are references to properties on objects that don't exist.
 * The template is full of v-ifs and it can be pretty confusing to wrap your head around what's going on.
 */

const store = useStore(key);

interface Props
{
  selectedData: SelectedData[] | null;
  geneList: Map<number, Gene>;
}

const props = defineProps<Props>();

const searchedGene = ref<Gene | Gene[] | null>(null);
const geneSuggestions = ref<Gene[]>([]);
const numberOfResults = ref<number>(0);

// fraction of gene bp length to add to the window when jumping
// to the gene after a search
const SEARCHED_GENE_WINDOW_FACTOR = 3;

watch(() => props.selectedData, () => {
  numberOfResults.value = 0;
  if (props.selectedData) {
    props.selectedData.forEach((dataObject) => {
      if (dataObject.type === 'trackSection' || dataObject.type === 'Gene' || dataObject.type === 'geneLabel') {
        if (dataObject.type === 'trackSection' && dataObject.genomicSection.gene) 
        {
          numberOfResults.value += (dataObject.genomicSection.hiddenGenes.length + 1);
          if (dataObject.genomicSection.hiddenGenes.length > 0) sortGeneList(dataObject.genomicSection.hiddenGenes);
        }
        if (dataObject.type === 'geneLabel') 
        {
          numberOfResults.value += (dataObject.genomicSection.combinedGenes.length + 1);
          if (dataObject.genomicSection.combinedGenes.length > 0) sortGeneList(dataObject.genomicSection.combinedGenes);
        }
        if (dataObject.type === 'Gene') 
        {
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
  // Need to figure out how to more efficiently type vuex getters
  // const loadedGenesByRGDId = store.getters.masterGeneMapByRGDId as Map<number, GeneDatatrack[]>;
  // const loadedGeneSymbols = store.getters.masterGeneMapBySymbol as Map<string, number[]>;

  let matches: Gene[] = [];
  props.geneList.forEach((gene) => {
    if (gene.symbol.toLowerCase().includes(event.query.toLowerCase()))
      // TODO: we may need to push a clone of the Gene here to break other relationships
      matches.push(gene);
  });

  const searchKey = searchedGene.value;
  matches = sortGeneMatches(searchKey, matches);
  geneSuggestions.value = matches;
};

const searchSVG = (event: any) => {
  const newData = getNewSelectedData(store, event.value);
  store.dispatch('setSelectedGeneIds', newData.rgdIds || []);
  store.dispatch('setSelectedData', newData.selectedData);
  // Only adjust window of the searched gene is on backbone

  if (event.value && event.value.speciesName === store.state.species?.name) {
    adjustSelectionWindow();
  }
};

const selectAndSearchSVG = (event: any) => {
  // If "Enter" is pressed, just search the first gene
  if (event.key === "Enter") {
    searchedGene.value = geneSuggestions.value[0];
    const newData = getNewSelectedData(store, searchedGene.value);
    store.dispatch('setGene', searchedGene.value);
    store.dispatch('setSelectedGeneIds', newData.rgdIds || []);
    store.dispatch('setSelectedData', newData.selectedData);
    if (searchedGene.value && searchedGene.value.speciesName === store.state.species?.name) {
      adjustSelectionWindow();
    }
  }
};

const getSuggestionDisplay = (item: any) => {
  return `${item.symbol} - ${item.speciesName}`;
};

const adjustSelectionWindow = () => {
  // const loadedGenes = store.state.loadedGenes;
  const selectionStart = store.state.detailedBasePairRange.start;
  const selectionStop = store.state.detailedBasePairRange.stop;

  // New start and stop will be +/- some multiple of the gene's length (currently 2x)
  const geneBasePairLength = searchedGene.value.stop - searchedGene.value.start;
  // Take the max of new start position, and selected region's original start
  // to avoid jumping to outside of loaded region
  const newInnerStart = Math.max(Math.floor(searchedGene.value.start
    - SEARCHED_GENE_WINDOW_FACTOR * geneBasePairLength), 0);
  // Take min of new stop and selected regions original stop
  const newInnerStop = Math.min(Math.floor(searchedGene.value.stop
    + SEARCHED_GENE_WINDOW_FACTOR * geneBasePairLength), store.state.chromosome?.seqLength ?? newInnerStart);
  //get orthologs for backbone gene, and determine the relative highest and lowest positioned genes to reset the window
  const orthologs = searchedGene.value.orthologs;

  const orthologInfo: any[] = [];
  // Object.entries(orthologs).forEach((ortholog) => {
  //   const currentOrtholog = loadedGenes.get(ortholog[1][0]);
  //   orthologInfo.push(currentOrtholog['genes'][Object.keys(currentOrtholog['genes'])][0]);
  // });
  
  if (orthologs.length > 0)
  // if (Object.entries(orthologs).length > 0)
  {

    orthologInfo.sort((a, b) => a.posY1 - b.posY1);

    const highestOrtholog = orthologInfo[0];
    const lowestOrtholog = orthologInfo[orthologInfo.length - 1];

    const topOrthologLength = highestOrtholog.gene.stop - highestOrtholog.gene.start;
    const bottomOrthologLength = lowestOrtholog.gene.stop - lowestOrtholog.gene.start;

    const svgHeight = PANEL_SVG_STOP - PANEL_SVG_START;
    const bpVisibleWindowLength = Math.abs(selectionStop - selectionStart);
    const pixelsPerBpRatio = svgHeight / bpVisibleWindowLength;
    const basePairsFromInnerSelection1 = Math.floor((highestOrtholog.posY1- SVGConstants.panelTitleHeight) * pixelsPerBpRatio);
    const basePairStart = Math.max(basePairsFromInnerSelection1 + selectionStart - (topOrthologLength * 5), 0);

    const basePairsFromInnerSelection2 = Math.floor((lowestOrtholog.posY1 - SVGConstants.panelTitleHeight) * pixelsPerBpRatio);
    const basePairStop = Math.min(
        basePairsFromInnerSelection2 + selectionStart + (bottomOrthologLength * 5),
        store.state.chromosome?.seqLength ?? basePairStart);


    // confirm the searched gene is visible in the result and adjust if not
    if (newInnerStart > basePairStart && newInnerStop < basePairStop)
    {
      store.dispatch('setDetailedBasePairRequest', { start: basePairStart, stop: basePairStop});
    }
    else if (newInnerStart < basePairStart)
    {
      newInnerStop > basePairStop ? store.dispatch('setDetailedBasePairRequest', { start: newInnerStart, stop: newInnerStop }) : store.dispatch('setDetailedBasePairRequest', { start: newInnerStart, stop: basePairStop });
    }
    else if (newInnerStop > basePairStop)
    {
      newInnerStart < basePairStart ? store.dispatch('setDetailedBasePairRequest', { start: newInnerStart, stop: newInnerStop}) : store.dispatch('setDetailedBasePairRequest', { start: basePairStart, stop: newInnerStop});
    }
  }
  else
  {
    store.dispatch('setDetailedBasePairRequest', { start: newInnerStart, stop: newInnerStop});
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

.clear-selection-btn
{
  margin-top: .5em;
  margin-left: auto;
  margin-right: auto;
}

.placeholder-msg
{
  font-size: 1.1rem;
  padding-right: 3rem;
  margin-top: 0rem;
  margin-bottom: 0;
}

.placeholder-msg-txt
{
  font-size: .9rem;
  font-style: italic;
  margin-top: .5em;
}
</style>
