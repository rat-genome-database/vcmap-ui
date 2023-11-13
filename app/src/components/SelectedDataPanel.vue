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
          <div class="selected-data-actions">
            <div class="clear-selection-btn">
            <Button
                v-tooltip.right="`Clear Selection`"
                class="p-button-info p-button-sm p-button-warning"
                icon="pi pi-ban"
                @click="clearSelectedGenes"
                rounded
            />
          </div>
          <div class="sort-options">
            <Button
              v-tooltip.top="`Sort by Label`"
              icon="pi pi-sort-alpha-down"
              :class="{'p-button-sm': true, 'sort-button-inactive': !sortBySymbol}"
              @click="symbolSort"
            />
            <Button 
              v-tooltip.top="`Sort by Start Position`"
              :icon="sortByPosition === 'desc' ? 'pi pi-sort-numeric-down-alt' : 'pi pi-sort-numeric-down'"
              :class="{'p-button-sm': true, 'sort-button-inactive': sortByPosition === 'off'}"
              @click="positionSort"
            />
          </div>
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
      <template v-for="dataObject in sortedSelectedData" :key="dataObject">
        <template v-if="dataObject.type === 'Gene'">
          <GeneInfo
            :gene="dataObject.genomicSection.gene ? dataObject.genomicSection.gene : dataObject.genomicSection"
            :chromosome="dataObject.genomicSection.chromosome ? dataObject.genomicSection.chromosome : dataObject.genomicSection.gene.chromosome"
            :start="dataObject.genomicSection.speciesStart ? dataObject.genomicSection.speciesStart : dataObject.genomicSection.start"
            :stop="dataObject.genomicSection.speciesStop ? dataObject.genomicSection.speciesStop : dataObject.genomicSection.stop"
            :gene-list="geneList"
          />
          <Divider />
        </template>

        <template v-else-if="(dataObject.type === 'trackSection' || dataObject.type === 'backbone' || dataObject.type === 'variantDensity')">
          <template v-if="(dataObject.type === 'trackSection')">
            <GeneInfo
              :gene="dataObject?.genomicSection.gene ? dataObject?.genomicSection.gene : null"
              :chromosome="dataObject.genomicSection.chromosome"
              :start="dataObject.genomicSection.speciesStart"
              :stop="dataObject.genomicSection.speciesStop"
              :chain-level="dataObject.genomicSection.chainLevel"
              :track-orientation="dataObject.genomicSection.isInverted ? '-' : '+'"
              :gene-list="geneList"
            />
          </template>
          <template v-else-if="(dataObject.type === 'backbone')">
            <GeneInfo
              :gene="null"
              :chromosome="dataObject.genomicSection.chromosome"
              :start="dataObject.genomicSection.windowStart"
              :stop="dataObject.genomicSection.windowStop"
              track-orientation="+"
              :gene-list="geneList"
            />
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
          <Divider />
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
import { ref, watch, computed } from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import { getNewSelectedData, sortGeneMatches, adjustSelectionWindow } from '@/utils/DataPanelHelpers';

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
const sortByPosition = ref('off');
const sortBySymbol = ref(false);

watch(() => props.selectedData, () => {
  numberOfResults.value = 0;
  if (props.selectedData != null)
  {
    numberOfResults.value = props.selectedData.filter((d: { type: string; }) => d.type === 'Gene').length;
  }
});

const clearSelectedGenes = () => {
  store.dispatch('setSelectedGeneIds', []);
  store.dispatch('setSelectedData', null);
  store.dispatch('setGene', null);
  searchedGene.value = null;
};

const symbolSort = () => {
  sortBySymbol.value = !sortBySymbol.value;
}
const positionSort = () => {
  const options = ['asc', 'desc', 'off'];
  const current = options.indexOf(sortByPosition.value);
  sortByPosition.value = options[(current + 1) % options.length]
}
const searchGene = (event: {query: string}) => {
  let matches: Gene[] = [];
  props.geneList.forEach((gene: Gene) => {
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

const sortedSelectedData = computed(() => {
  if (!props.selectedData || props.selectedData.length === 0) return [];

  const priority = props.selectedData[0]?.genomicSection?.speciesName;

  return [...props.selectedData].sort((a, b) => {
    if (a.type === 'Gene' && b.type === 'Gene') {
      if (a.genomicSection.speciesName === priority && b.genomicSection.speciesName !== priority) {
        return -1;
      }
      if (b.genomicSection.speciesName === priority && a.genomicSection.speciesName !== priority) {
        return 1;
      }
      if (sortByPosition.value === 'asc') {
        return a.genomicSection.start - b.genomicSection.start;
      }
      if (sortByPosition.value === 'desc') {
        return b.genomicSection.start - a.genomicSection.start;
      }
      if (sortBySymbol.value) {
        return a.genomicSection.symbol.localeCompare(b.genomicSection.symbol);
      }
    return a.genomicSection.speciesName.localeCompare(b.genomicSection.speciesName);
  }});
});
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

.sort-button-inactive {
  opacity: 0.6
}

.sort-options {
  display: flex;
  gap: 5px;
}

.selected-data-actions {
  display: flex;
  align-items: end;
};

.selected-data-actions > :not(:last-child) {
  margin-right: 100px;
};
</style>
