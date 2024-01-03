<template>
  <div>
    <AutoComplete
      v-model="searchedGene"
      :suggestions="geneSuggestions"
      @complete="searchGene($event)"
      @item-select="searchSVG($event)"
      :field="getSuggestionDisplay"
      :empty-search-message="`
        No matching genes found within the loaded synteny data. Try loading a new configuration containing the chromosome of the gene you are searching for.
      `"
      :minLength="3"
      placeholder="Search loaded genes..."
    />
    <Button size="small" v-if="preSearchViews.length > 0" icon="pi pi-undo" class="p-button-success back-button" v-tooltip="'Go Back'" @click="goBack()" />
  </div>
</template>

<script lang="ts" setup>
import SelectedData from '@/models/SelectedData';
import Gene from '@/models/Gene';
import { BasePairRange } from '@/models/BackboneSelection';
import { inject, ref,} from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import { getNewSelectedData, sortGeneMatches } from '@/utils/DataPanelHelpers';
import useGeneSearchAndSelect from '@/composables/useGeneSearchAndSelect';
import { querySyntenyForSearchZoomKey } from '@/injection_keys/main';

const store = useStore(key);

const queryForSynteny = inject(querySyntenyForSearchZoomKey);
const { getWindowBasePairRangeForGene } = useGeneSearchAndSelect(store);

interface Props
{
  selectedData: SelectedData[] | null;
  geneList: Map<number, Gene>;
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
    store.dispatch('setDetailedBasePairRequest', {range: lastView.range, source: `Searched: ${lastView.gene.symbol}`});
  }
};

const searchSVG = async (event: { value: Gene }) => {
  const newData = getNewSelectedData(store, event.value, props.geneList);
  store.dispatch('setGene', event.value.clone()); // Update store config to see this as last gene selected
  store.dispatch('setSelectedGeneIds', newData.rgdIds || []);
  store.dispatch('setSelectedData', newData.selectedData);

  if (event.value && store.state.chromosome != null && queryForSynteny != null)
  {
    const newWindow = await getWindowBasePairRangeForGene(
      queryForSynteny,
      store.state.chromosome,
      event.value.rgdId,
      props.geneList
    );

    if (lastSearch != null) {
      // Only add the current search if it isn't the first search (no need to add the very first search to the array since the user can only go back)
      preSearchViews.value.push(lastSearch);
    }
    store.dispatch('setDetailedBasePairRequest', {range: newWindow, source: `Searched: ${event.value.symbol}`});
    if (newWindow) {
      // Now that this search has been completed, store it as the last search
      lastSearch = {gene: event.value, range: newWindow};
    }
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