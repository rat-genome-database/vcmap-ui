<template>
  <!-- SVG definitions -->
  <defs>
    <linearGradient id="selectedStripes" gradientUnits="userSpaceOnUse"
      x2="5" spreadMethod="repeat" gradientTransform="rotate(-45)">
      <stop offset="0" stop-color="gray"/>
      <stop offset="0.40" stop-color="gray"/>
      <stop offset="0.40" stop-color="lightgray"/>
      <stop offset="1.0" stop-color="lightgray"/>
    </linearGradient>
  </defs>

  <!-- SVG content -->
  <template v-for="(blockSection, index) in region.syntenyBlocks" :key="index">
    <rect
      @mouseenter="onMouseEnter($event, blockSection, 'block')"
      @mouseleave="onMouseLeave($event, blockSection, 'block')"
      :y="blockSection.posY1"
      :x="posX"
      :width="width"
      :height="blockSection.height"
      :fill="getSectionFill(blockSection)"
      :fill-opacity="1"
    />
  </template>

  <template v-for="(datatrack, index) in region.datatrackSections" :key="index">
    <rect
      @mouseenter="onMouseEnter($event, datatrack, 'gene')"
      @mouseleave="onMouseLeave($event, datatrack, 'gene')"
      :y="datatrack.posY1"
      :x="posX + 50"
      :width="width/2"
      :height="datatrack.height"
      :fill="getSectionFill(datatrack)"
      :fill-opacity=".7"
    />
  </template>

  <template v-for="(gapSection, index) in region.syntenyGaps" :key="index">
    <line
      class="section gap"
      :x1="posX + (width / 2)" :x2="posX + (width / 2)" 
      :y1="gapSection.posY1" :y2="gapSection.posY2" />
    />
  </template>
  
</template>


<script lang="ts" setup>
import { watch, onMounted} from 'vue';
import SelectedData from '@/models/SelectedData';
import OrthologLine from '@/models/OrthologLine';
import SyntenyRegion from '@/new_models/SyntenyRegion';
import SyntenySection from '@/new_models/SyntenySection';
import DatatrackSection from '@/new_models/DatatrackSection';
import { toRefs } from '@vue/reactivity';
import { useStore } from 'vuex';
import SVGConstants from '@/utils/SVGConstants';
import { key } from '@/store';
import { sortGeneList, getNewSelectedData } from '@/utils/DataPanelHelpers';

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
  posX: number;
  width: number;
  lines?: OrthologLine[] | undefined;
  region?: SyntenyRegion;
}
const props = defineProps<Props>();

//Converts each property in this object to its own reactive prop
toRefs(props);

const onMouseEnter = (event: any, section: SyntenySection | DatatrackSection, type: string) => {
  section.isHovered = true;
  
  // If there are selected genes, don't update the selected data panel
  if (store.state.selectedGeneIds.length === 0) {
    const selectedData = new SelectedData(section, type);
    store.dispatch('setSelectedData', [selectedData]);
  }
};

const onMouseLeave = (event: any, section: SyntenySection | DatatrackSection) => {
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

.section.gap
{
  stroke-width: 1;
  stroke: black;
}
</style>