<template>

  <template v-for="(blockSection, index) in region.syntenyBlocks" :key="index">
    <rect
      @mouseenter="onMouseEnter(blockSection, 'trackSection')"
      @mouseleave="onMouseLeave(blockSection)"
      :y="blockSection.posY1"
      :x="blockSection.posX1"
      :width="blockSection.width"
      :height="blockSection.height"
      :fill="getSectionFill(blockSection)"
      :fill-opacity="1"
    />

    <!-- Chromosome Label -->
    <text v-if="(showChromosome && blockSection.height > 15)"
      class="chromosome-label"
      :x="blockSection.posX1 + (blockSection.width / 2)"
      :y="blockSection.posY1 + (blockSection.height / 2)"
      dominant-baseline="middle"
      text-anchor="middle">
      {{blockSection.chromosome.chromosome}}
    </text>

    <!-- Syntenic Lines -->
    <template v-if="showSyntenyOnHover">
      <line v-if="blockSection.isHovered"
        class="section connection-line"
        :x1="blockSection.posX1 + blockSection.width" :x2="SVGConstants.backboneXPosition" 
        :y1="blockSection.posY1" :y2="(blockSection.isInverted) ? blockSection.posY2 : blockSection.posY1" />
      <line v-if="blockSection.isHovered"
        class="section connection-line"
        :x1="blockSection.posX1 + blockSection.width" :x2="SVGConstants.backboneXPosition" 
        :y1="blockSection.posY2" :y2="(blockSection.isInverted) ? blockSection.posY1 : blockSection.posY2" />
    </template>
  </template>

  <template v-for="(datatrack, index) in region.datatrackSections" :key="index">
    <rect
      @mouseenter="onMouseEnter(datatrack, 'Gene')"
      @mouseleave="onMouseLeave(datatrack)"
      :y="datatrack.posY1"
      :x="datatrack.posX1"
      :width="datatrack.width"
      :height="datatrack.height"
      :fill="getSectionFill(datatrack)"
      :fill-opacity=".7"
    />
  </template>

  <template v-for="(gapSection, index) in region.syntenyGaps" :key="index">
    <line
      class="section gap"
      :x1="gapSection.posX1" :x2="gapSection.posX2" 
      :y1="gapSection.posY1" :y2="gapSection.posY2" />
    />
  </template>
  
</template>


<script lang="ts" setup>
import SelectedData, { SelectedDataType } from '@/models/SelectedData';
import OrthologLine from '@/models/OrthologLine';
import SyntenyRegion from '@/new_models/SyntenyRegion';
import SyntenySection from '@/new_models/SyntenySection';
import DatatrackSection from '@/new_models/DatatrackSection';
import { toRefs } from '@vue/reactivity';
import { useStore } from 'vuex';
import { key } from '@/store';
import { sortGeneList, getNewSelectedData } from '@/utils/DataPanelHelpers';
import SVGConstants from '@/utils/SVGConstants';

const LEVEL_2_WIDTH_MULTIPLIER = 0.75;
const LABEL_Y_OFFSET = 3;
const HOVER_HIGHLIGHT_COLOR = '#FF7C60';
const SELECTED_HIGHLIGHT_COLOR = '#FF4822';

const store = useStore(key);

interface Props 
{
  showSyntenyOnHover?: boolean;
  showStartStop?: boolean;
  showChromosome?: boolean;
  showGeneLabel?: boolean;
  lines?: OrthologLine[] | undefined;
  region: SyntenyRegion;
}
const props = defineProps<Props>();

//Converts each property in this object to its own reactive prop
toRefs(props);

const onMouseEnter = (section: SyntenySection | DatatrackSection, type: SelectedDataType) => {
  section.isHovered = true;
  
  // If there are selected genes, don't update the selected data panel
  if (store.state.selectedGeneIds.length === 0) {
    const selectedData = new SelectedData(section, type);
    store.dispatch('setSelectedData', [selectedData]);
  }
};

const onMouseLeave = (section: SyntenySection | DatatrackSection) => {
  if (section)
  {
    section.isHovered = false;
  }
  
  // Only reset data onMouseLeave if there isn't a selected gene
  if (store.state.selectedGeneIds.length === 0) {
    store.dispatch('setSelectedData', null);
  }
};

const getSectionFill = (section: SyntenySection | DatatrackSection) => {
  if (section.isSelected) {return SELECTED_HIGHLIGHT_COLOR;}
  if (section.isHovered) {return HOVER_HIGHLIGHT_COLOR;}
  return section.elementColor;
};

const highlightSelections = (selectedGeneIds: number[]) => {
  // Look through the sections and highlight based on selected genes
  /* props.track.sections.forEach((section) => {
    if (checkSectionForGene(section, selectedGeneIds)) {
      section.isSelected = true;
    } else {
      section.isSelected = false;
    }
  }); */
  // Highlight the line if needed, and make sure genes highlighted too
  // (this ensures backbone and comparitive genes are highlighted, regardless of which is clicked)
  props.lines?.forEach((line) => {
    if (selectedGeneIds.includes(line.backboneGene.gene?.rgdId || -1) ||
        selectedGeneIds.includes(line.comparativeGene.gene?.rgdId || -1)) {
      line.isSelected = true;
      line.backboneGene.isSelected = true;
      line.comparativeGene.isSelected = true;
    } else {
      line.isSelected = false;
    }
  });

  // After selecting the sections, check if we should use alt labels
  props.track.geneLabels.forEach((label) => {
    // Only consider geneLabels that are already visible anyway
    if (label.isVisible) {
      // If the main gene for this section is selected, we'll use the normal label
      let useAltLabel = false;
      if (selectedGeneIds.includes(label.section.gene.rgdId)) {
        useAltLabel = false;
      } else { // Otherwise if any selected ids exist in the alt labels, we'll use an alt label
        const altLabelIds = label.section.altLabels.map((label) => label.rgdId);
        if (selectedGeneIds.some((id) => altLabelIds.includes(id))) {
          useAltLabel = true;
        }
      }
      label.section.showAltLabel = useAltLabel;
    }
  });
};

const onClick = (event: any, section: DatatrackSection, type: string) => {
  if (!section.gene?.rgdId) {
    return;
  }
  // If clicked section already selected, just reset the selectedGeneId state
  if (store.state.selectedGeneIds.includes(section.gene?.rgdId || -1)) {
    store.dispatch('setSelectedGeneIds', []);
    store.dispatch('setSelectedData', null);
    return;
  }

  // If shift key is held, we'll just add to the selections, otherwise, reset first
  let geneIds: number[] = event.shiftKey ? [...store.state.selectedGeneIds] : [];

  // Get the list of genes to build the selected data, if this is a gene label, we
  // add all the combined genes to the selected data panel
  // Otherwise if its a track section, we'll add the hidden genes
  let newSelectedData: SelectedData[] = [];
  const geneSectionList = type === 'geneLabel' ? [section, ...(section.combinedGenes || [])] : [section, ...(section.hiddenGenes || [])];
  if (geneSectionList && geneSectionList.length > 0) {
    // If this is a geneLabel, we're going to set all combined genes as "selected"
    geneSectionList.forEach((section) => geneIds.push(section.gene.rgdId));
    // Alphabetically sort the combined/hidden gene lists (LOC genes at end of list)
    sortGeneList(geneSectionList);
    // Set the new selected data from gene list
    geneSectionList.forEach((section) => {
      if (section.gene) {
        const newData = getNewSelectedData(store, section.gene);
        const geneAndOrthologs = newData.selectedData;
        const newGeneIds = newData.rgdIds;
        newSelectedData.push(...geneAndOrthologs);
        geneIds.push(...newGeneIds);
      }
    });
  }

  store.dispatch('setSelectedGeneIds', geneIds || []);
  if (event.shiftKey) {
    const selectedDataArray = [...(store.state.selectedData || []), ...newSelectedData];
    store.dispatch('setSelectedData', selectedDataArray);
  } else {
    store.dispatch('setSelectedData', newSelectedData);
  }
};

</script>

<style lang="scss" scoped>
.label.small
{
  font: normal 8px sans-serif;

  &:hover
  {
    cursor: pointer;
  }
}

.chromosome-label
{
  font: normal 12px sans-serif;
  fill: #4c4b4b;
}

.ortholog-line
{
  stroke-width: 1;
  &:hover
  {
    stroke-width: 2.5;
  }
}

.section
{
  stroke-width: 0;
  &.gap
  {
    stroke-width: 1;
    stroke: black;
  }

  &.connection-line
  {
    stroke-width: 1;
    stroke: black;
    stroke-dasharray: 4;
  }

  &.level-2
  {
    filter: brightness(60%);
  }

  &:hover
  {
    cursor: pointer;
  }
}
</style>