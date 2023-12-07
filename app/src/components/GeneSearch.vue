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
import { BasePairRange } from '@/models/BackboneSelection';
import { ref,} from 'vue';
import { useStore } from 'vuex';
import { key } from '@/store';
import { getNewSelectedData, sortGeneMatches, adjustSelectionWindow } from '@/utils/DataPanelHelpers';

const store = useStore(key);

interface Props
{
  selectedData: SelectedData[] | null;
  geneList: Map<number, Gene>;
}

const props = defineProps<Props>();
const searchedGene = ref<Gene | null>(null);
const geneSuggestions = ref<Gene[]>([]);
const preSearchViews = ref<BasePairRange[]>([]);

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
    //clear searched gene
    searchedGene.value = null;
    store.dispatch('setDetailedBasePairRequest', lastView);
  }
};

const searchSVG = (event: { value: Gene }) => {
  const newData = getNewSelectedData(store, event.value, props.geneList);
  store.dispatch('setGene', event.value.clone()); // Update store config to see this as last gene selected
  store.dispatch('setSelectedGeneIds', newData.rgdIds || []);
  store.dispatch('setSelectedData', newData.selectedData);

  if (event.value)
  {
    const newWindow = adjustSelectionWindow(event.value, props.geneList, store);
    //cache our current window so we can go back to it
    const currentWindow = store.state.detailedBasePairRange;
    preSearchViews.value.push(currentWindow);    
    store.dispatch('setDetailedBasePairRequest', newWindow);
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