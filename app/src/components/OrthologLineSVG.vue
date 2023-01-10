<template>
  <line
    class="ortholog-line"
    :stroke="lineColor(line)"
    :x1="line.posX1" :x2="line.posX2"
    :y1="line.posY1" :y2="line.posY2"
    @click="onClick($event, line)"
    @mouseenter="onMouseEnter(line, 'Gene')"
    @mouseleave="onMouseLeave(line, 'Gene')"
  />
</template>

<script lang="ts" setup>
import OrthologLine from '@/models/OrthologLine';
import { useStore } from 'vuex';
import { key } from '@/store';
import SelectedData, { SelectedDataType } from '@/models/SelectedData';
import { getNewSelectedData } from '@/utils/DataPanelHelpers';

const store = useStore(key);

const SELECTED_HIGHLIGHT_COLOR = '#FF4822';
const HOVER_HIGHLIGHT_COLOR = '#FF7C60';

// :stroke="(line.isSelected ? SELECTED_HIGHLIGHT_COLOR : 'lightgray')"

interface Props
{
  line: OrthologLine;
}

defineProps<Props>();

const onMouseEnter = (line: any, type: any) => {

  line.isHovered = true;

  // If there are selected genes, don't update the selected data panel
  // if (store.state.selectedGeneIds.length === 0) {
  //   const selectedData = new SelectedData(line, type);
  //   store.dispatch('setSelectedData', [selectedData]);
  // }
};

const onMouseLeave = (line: any, type: any) => {
  if (line) {
    line.isHovered = false;
  }

  // Only reset data onMouseLeave if there isn't a selected gene
  // if (store.state.selectedGeneIds.length === 0) {
  //   store.dispatch('setSelectedData', null);
  // }

};

const onClick = (event: any, line: any) => {
  if (!line.comparativeGene.gene?.rgdId || !line.backboneGene.gene?.rgdId) return;

  // If clicked section already selected, just reset the selectedGeneId state
  if (store.state.selectedGeneIds.includes(line.comparativeGene.gene?.rgdId || line.backboneGene.gene?.rgdId || -1)) {
    store.dispatch('setSelectedGeneIds', []);
    store.dispatch('setSelectedData', null);
  }

  // If shift key is held, we'll just add to the selections, otherwise, reset first
  let geneIds: number[] = event.shiftKey ? [...store.state.selectedGeneIds] : [];

  let newSelectedData: SelectedData[] = [];

  const newData = getNewSelectedData(store, line.comparativeGene.gene);
  const geneAndOrthologs = newData.selectedData;
  const newGeneIds = newData.rgdIds;
  newSelectedData.push(...geneAndOrthologs);
  geneIds.push(...newGeneIds);

  store.dispatch('setSelectedGeneIds', geneIds || []);
  if (event.shiftKey) {
    const selectedDataArray = [...(store.state.selectedData || []), ...newSelectedData];
    store.dispatch('setSelectedData', selectedDataArray);
  } else {
    store.dispatch('setSelectedData', newSelectedData);
  }

};

const lineColor = (line: any) => {
  if (line.isSelected) {return SELECTED_HIGHLIGHT_COLOR;}
  if (line.isHovered) {return HOVER_HIGHLIGHT_COLOR;}
  return 'lightgray';
};

// const highlightGeneBlocks = (line: any, type: any) => {

// };

</script>