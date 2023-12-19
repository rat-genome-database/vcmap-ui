<template>
  <div>
    <AutoComplete
      v-model="searchedGene"
      :suggestions="geneSuggestions"
      @complete="searchGene($event)"
      @item-select="searchSVG($event)"
      :field="getSuggestionDisplay"
      :minLength="3"
      placeholder="Search loaded genes..."
    />
    <Button size="small" v-if="preSearchViews.length > 0" icon="pi pi-undo" class="p-button-success back-button" v-tooltip="'Go Back'" @click="goBack()" />
  </div>
</template>

<script lang="ts" setup>
import SelectedData from '@/models/SelectedData';
import Gene from '@/models/Gene';
import Chromosome from '@/models/Chromosome';
import { BasePairRange } from '@/models/BackboneSelection';
import { ref,} from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import { getNewSelectedData, sortGeneMatches, adjustSelectionWindow } from '@/utils/DataPanelHelpers';

const store = useStore(key);
const MAX_SEARCH_ITERS = 5;

interface Props
{
  selectedData: SelectedData[] | null;
  geneList: Map<number, Gene>;
  queryForSynteny: (backboneChromosome: Chromosome, start: number, stop: number, mapKey: number) => Promise<void>;
}

const props = defineProps<Props>();
const searchedGene = ref<Gene | null>(null);
const geneSuggestions = ref<Gene[]>([]);
// Backlog of previous searches (should not include current search)
const preSearchViews = ref<{gene: Gene; range: BasePairRange;}[]>([]);
// Most recent gene search
let lastSearch: {gene: Gene; range: BasePairRange;} | null = null;

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

const goBack = () => {
  const lastView = preSearchViews.value.pop();
  if (lastView) {
    const newData = getNewSelectedData(store, lastView.gene, props.geneList);
    store.dispatch('setGene', lastView.gene.clone()); // Update store config to see this as last gene selected
    store.dispatch('setSelectedGeneIds', newData.rgdIds || []);
    store.dispatch('setSelectedData', newData.selectedData);
    //clear searched gene
    searchedGene.value = lastView.gene;
    store.dispatch('setDetailedBasePairRequest', {range: lastView.range});
  }
};

const searchSVG = async (event: { value: Gene }) => {
  const newData = getNewSelectedData(store, event.value, props.geneList);
  store.dispatch('setGene', event.value.clone()); // Update store config to see this as last gene selected
  store.dispatch('setSelectedGeneIds', newData.rgdIds || []);
  store.dispatch('setSelectedData', newData.selectedData);

  if (event.value)
  {
    // Adapatively generate the newWindow based on the searched gene and its new position
    // when the zoom is increased
    let newWindow;
    for (let i = 0; i < MAX_SEARCH_ITERS; i++) {
      newWindow = adjustSelectionWindow(event.value, props.geneList, store);
      // Get new synteny blocks based on the newWindow to check the location of searched gene
      await props.queryForSynteny(store.state.chromosome, newWindow.start, newWindow.stop, event.value.mapKey);
      // This should the updated searched gene after updating resoluiton of the region
      const searchedGene = props.geneList.get(event.value.rgdId);
      // After the gene is updated, check if it is within the new window
      if (searchedGene && searchedGene.backboneStart > newWindow.start && searchedGene.backboneStop < newWindow.stop) {
        break;
      }
    }
    //cache our current window so we can go back to it
    const currentWindow = store.state.detailedBasePairRange;
    if (lastSearch != null) {
      // Only add the current search if it isn't the first search (no need to add the very first search to the array since the user can only go back)
      preSearchViews.value.push(lastSearch);
    }
    store.dispatch('setDetailedBasePairRequest', {range: newWindow, source: `Searched: ${event.value.symbol}`});
    lastSearch = {gene: event.value, range: currentWindow};
  }
};

const getSuggestionDisplay = (item: any) => {
  return `${item.symbol} - ${item.speciesName}`;
};

</script>

<style scoped>
.back-button {
  margin-left: 0.5em;
}
</style>