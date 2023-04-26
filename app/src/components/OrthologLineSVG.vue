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
import Gene from '@/models/Gene';

const store = useStore(key);

const SELECTED_HIGHLIGHT_COLOR = '#FF4822';
const HOVER_HIGHLIGHT_COLOR = '#FF7C60';

interface Props
{
  line: OrthologLine;
}

defineProps<Props>();

const onMouseEnter = (line: OrthologLine) => {

  if (!line.isSelected) {
    changeHoverStatusOnOrthologLines(line, true);
    changeDatatrackColors(line, HOVER_HIGHLIGHT_COLOR);
  }

  // If there are selected genes, don't update the selected data panel
  if (store.state.selectedGeneIds.length === 0) {
    const orthologGenesMap = getOrthologLineGenes(line);
    const selectedOrthologs = Array.from(orthologGenesMap.values())
      .map(g => new SelectedData(g, 'Gene'));
    store.dispatch('setSelectedData', selectedOrthologs);
  }

};

const onMouseLeave = (line: OrthologLine) => {
  if (!line.isSelected) {
    changeHoverStatusOnOrthologLines(line, false);
    changeDatatrackColors(line, '#000000');
  }

  // Only reset data onMouseLeave if there isn't a selected gene
  if (store.state.selectedGeneIds.length === 0) {
    store.dispatch('setSelectedData', null);
  }

};

const onClick = (event: any, line: OrthologLine) => {

  const isSelected = store.state.selectedGeneIds.includes(line.endGene.rgdId || line.startGene.rgdId || -1);

  // If clicked section already selected, just reset the selectedGeneId state
  if (line.isSelected || isSelected) {
    store.dispatch('setSelectedGeneIds', []);
    store.dispatch('setSelectedData', null);
    line.isSelected = false;

    return;
  }

  changeDatatrackColors(line, SELECTED_HIGHLIGHT_COLOR);

  // If shift key is held, we'll just add to the selections, otherwise, reset first
  let geneIds: number[] = event.shiftKey ? [...store.state.selectedGeneIds] : [];

  let newSelectedData: SelectedData[] = [];

  const orthologGenesMap = getOrthologLineGenes(line);

  let selectedOrthologs = Array.from(orthologGenesMap.values())
    .map(g => new SelectedData(g, 'Gene'));
  
  newSelectedData.push(...selectedOrthologs);
  geneIds.push(...Array.from(orthologGenesMap.keys()));

  store.dispatch('setSelectedGeneIds', geneIds || []);
  if (event.shiftKey) {
    const selectedDataArray = [...(store.state.selectedData || []), ...newSelectedData];
    store.dispatch('setSelectedData', selectedDataArray);
  } else {
    store.dispatch('setSelectedData', newSelectedData);
  }
};

const lineColor = (line: OrthologLine) => {
  const selectedGeneIds = store.state.selectedGeneIds;
  if (selectedGeneIds.includes(line.endGene.rgdId || line.startGene.rgdId || -1)) {
    return SELECTED_HIGHLIGHT_COLOR;
  }

  if (line.isHovered) {
    return HOVER_HIGHLIGHT_COLOR;
  }
  
  return 'lightgray';
};

const changeDatatrackColors = (line: OrthologLine, colorHex: string) => {
  [line, ...line.chainedOrthologLines].forEach(l => {
    if (l.startGeneDatatrack)
      l.startGeneDatatrack.elementColor = colorHex;
    if (l.endGeneDatatrack)
      l.endGeneDatatrack.elementColor = colorHex;
  });
};

const changeHoverStatusOnOrthologLines = (line: OrthologLine, isHovered: boolean) => {
  [line, ...line.chainedOrthologLines].forEach(l => {
    l.isHovered = isHovered;
  });
};

const getOrthologLineGenes = (line: OrthologLine) => {
  const genes: Map<number, Gene> = new Map();
  [line, ...line.chainedOrthologLines].forEach(l => {
    genes.set(l.startGene.rgdId, l.startGene);
    genes.set(l.endGene.rgdId, l.endGene);
  });

  return genes;
};
</script>