<template>
  <line
    class="ortholog-line"
    :stroke="lineColor(line)"
    :x1="line.posX1" :x2="line.posX2"
    :y1="line.posY1" :y2="line.posY2"
    @click="onClick($event, line)"
    @mouseenter="onMouseEnter(line)"
    @mouseleave="onMouseLeave(line)"
  />
</template>

<script lang="ts" setup>
import OrthologLine from '@/models/OrthologLine';
import { useStore } from 'vuex';
import { key } from '@/store';
import SelectedData from '@/models/SelectedData';
import { getNewSelectedData } from '@/utils/DataPanelHelpers';

const store = useStore(key);

const SELECTED_HIGHLIGHT_COLOR = '#FF4822';
const HOVER_HIGHLIGHT_COLOR = '#FF7C60';

interface Props
{
  line: OrthologLine;
}

defineProps<Props>();

const onMouseEnter = (line: OrthologLine) => {

  line.isHovered = true;
  if (line.offBackboneGeneDatatrack) line.offBackboneGeneDatatrack.elementColor = HOVER_HIGHLIGHT_COLOR;
  if (line.backboneGeneDatatrack) line.backboneGeneDatatrack.elementColor = HOVER_HIGHLIGHT_COLOR;

  // If there are selected genes, don't update the selected data panel
  if (store.state.selectedGeneIds.length === 0) {
    const selectedOrthologs = [
      new SelectedData(line.offBackboneGene, 'Gene'),
      new SelectedData(line.backboneGene, 'Gene'),
    ];
    //const newSelectedData = getNewSelectedData(store, line.offBackboneGene);
    store.dispatch('setSelectedData', selectedOrthologs);
  }

};

const onMouseLeave = (line: OrthologLine) => {
  if (line) {
    line.isHovered = false;
    if (line.offBackboneGeneDatatrack) line.offBackboneGeneDatatrack.elementColor = '#000000';
    if (line.backboneGeneDatatrack) line.backboneGeneDatatrack.elementColor = '#000000';
  }

  // Only reset data onMouseLeave if there isn't a selected gene
  if (store.state.selectedGeneIds.length === 0) {
    store.dispatch('setSelectedData', null);
  }

};

const onClick = (event: any, line: OrthologLine) => {
  line.isSelected = true;
  // If clicked section already selected, just reset the selectedGeneId state
  if (store.state.selectedGeneIds.includes(line.offBackboneGene.rgdId || line.backboneGene.rgdId || -1)) {
    store.dispatch('setSelectedGeneIds', []);
    store.dispatch('setSelectedData', null);
  }

  // If shift key is held, we'll just add to the selections, otherwise, reset first
  let geneIds: number[] = event.shiftKey ? [...store.state.selectedGeneIds] : [];

  let newSelectedData: SelectedData[] = [];

  // FIXME
  console.log('LINE', line);
  const newData = getNewSelectedData(store, line.offBackboneGene);
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

const lineColor = (line: OrthologLine) => {
  if (line.isSelected) {return SELECTED_HIGHLIGHT_COLOR;}
  if (line.isHovered) {return HOVER_HIGHLIGHT_COLOR;}
  return 'lightgray';
};

</script>