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
                class="p-button-info p-button-sm p-button-warning"
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

        <template v-else-if="dataObject?.type === 'variantDensity'">
          <div>
            <span>Chr{{dataObject.genomicSection.chromosome}}: </span>
            <span>
              {{Formatter.addCommasToBasePair(dataObject.genomicSection.speciesStart)}} - {{Formatter.addCommasToBasePair(dataObject.genomicSection.speciesStop)}}
            </span>
          </div>
          <div>
            <span>Variant Count: {{ Formatter.addCommasToBasePair(dataObject.genomicSection.variantCount) }}</span>
          </div>
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
import { ref, watch} from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import { getNewSelectedData, sortGeneList, sortGeneMatches, adjustSelectionWindow } from '@/utils/DataPanelHelpers';

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

const searchedGene = ref<Gene | null>(null);
const geneSuggestions = ref<Gene[]>([]);
const numberOfResults = ref<number>(0);

watch(() => props.selectedData, () => {
  numberOfResults.value = 0;
  if (props.selectedData)
  {
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
  let matches: Gene[] = [];
  props.geneList.forEach((gene) => {
    if (gene.symbol.toLowerCase().includes(event.query.toLowerCase()))
      matches.push(gene);
  });

  const searchKey = searchedGene.value;
  matches = sortGeneMatches(searchKey, matches);
  geneSuggestions.value = matches;


};

const searchSVG = (event: { value: Gene }) => {
  const newData = getNewSelectedData(store, event.value, props.geneList);
  store.dispatch('setGene', event.value.clone()); // Update store config to see this as last gene selected
  store.dispatch('setSelectedGeneIds', newData.rgdIds || []);
  store.dispatch('setSelectedData', newData.selectedData);

  if (event.value)
  {
    const newWindow = adjustSelectionWindow(event.value, props.geneList, store);
    store.dispatch('setDetailedBasePairRequest', newWindow);
  }
};

const getSuggestionDisplay = (item: any) => {
  return `${item.symbol} - ${item.speciesName}`;
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
