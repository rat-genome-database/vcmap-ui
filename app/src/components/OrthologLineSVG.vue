<template>
  <line
    class="ortholog-line"
    :stroke="lineColor"
    :stroke-width="line.thickness"
    :x1="line.posX1" :x2="line.posX2"
    :y1="line.posY1" :y2="line.posY2"
    @click="onClick($event, line)"
    @mouseenter="onMouseEnter($event, line)"
    @mouseleave="onMouseLeave(line)"
  />
</template>

<script lang="ts" setup>
import OrthologLine from '@/models/OrthologLine';
import { useStore } from 'vuex';
import { key } from '@/store';
import SelectedData from '@/models/SelectedData';
import { computed } from 'vue';
import { getSelectedDataAndGeneIdsFromOrthologLine } from '@/utils/OrthologHandler';
import useSyntenyAndDataInteraction from '@/composables/useSyntenyAndDataInteraction';

const store = useStore(key);

const SELECTED_HIGHLIGHT_COLOR = '#FF4822';
const HOVER_HIGHLIGHT_COLOR = '#FF7C60';

const { showHoveredData, hideHoveredData } = useSyntenyAndDataInteraction(store);

interface Props
{
  line: OrthologLine;
}

const props = defineProps<Props>();

const lineColor = computed(() => {
  const selectedGeneIds = store.state.selectedGeneIds;
  if (props.line.isSelected || selectedGeneIds.includes(props.line.endGene.rgdId || props.line.startGene.rgdId || -1)) {
    return SELECTED_HIGHLIGHT_COLOR;
  }

  if (props.line.isHovered) {
    return HOVER_HIGHLIGHT_COLOR;
  }

  return 'lightgray';
});

const onMouseEnter = (event: MouseEvent, line: OrthologLine) => {

  if (!line.isSelected) {
    changeHoverStatusOnOrthologLines(line, true);
    changeDatatrackColors(line, HOVER_HIGHLIGHT_COLOR);
    changeHoverLineThickness(line, true);
  }

  showHoveredData(line, event);
};

const onMouseLeave = (line: OrthologLine) => {
  if (!line.isSelected) {
    changeHoverStatusOnOrthologLines(line, false);
    changeDatatrackColors(line, '#000000');
    changeHoverLineThickness(line, false);
  }

  hideHoveredData();

  // Only reset data onMouseLeave if there isn't a selected gene
  if (store.state.selectedGeneIds.length === 0 && store.state.selectedData?.length === 0) {
    store.dispatch('setSelectedData', null);
  }

};

const onClick = (event: any, line: OrthologLine) => {

  const isSelected = store.state.selectedGeneIds.includes(line.endGene.rgdId || line.startGene.rgdId || -1);

  // If clicked section already selected, just reset the selectedGeneId state
  if ((event.ctrlKey || event.metaKey) && isSelected) {
    store.dispatch('setSelectedGeneIds', []);
    store.dispatch('setSelectedData', null);
    line.isSelected = false;

    return;
  }

  changeDatatrackColors(line, SELECTED_HIGHLIGHT_COLOR);

  // If shift key is held, we'll just add to the selections, otherwise, reset first
  let geneIds: number[] = event.shiftKey ? [...store.state.selectedGeneIds] : [];

  let newSelectedData: SelectedData[] = [];

  const {
    selectedData: selectedOrthologs,
    selectedGeneIds,
  } = getSelectedDataAndGeneIdsFromOrthologLine(line);
  
  newSelectedData.push(...selectedOrthologs);
  geneIds.push(...selectedGeneIds);

  store.dispatch('setSelectedGeneIds', geneIds || []);
  if (event.shiftKey) {
    const selectedDataArray = [...(store.state.selectedData || []), ...newSelectedData];
    store.dispatch('setSelectedData', selectedDataArray);
  } else {
    store.dispatch('setSelectedData', newSelectedData);
  }
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

const changeHoverLineThickness = (line: OrthologLine, isHovered: boolean) => {
  [line, ...line.chainedOrthologLines].forEach(l => {
    l.thickness = isHovered ? 3 : 1;
  });
};
</script>

<style lang="scss" scoped>
.ortholog-line
{
  stroke-width: 1;
  &:hover
  {
    cursor: pointer;
  }
}
</style>