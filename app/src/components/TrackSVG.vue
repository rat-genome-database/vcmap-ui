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

  <template v-for="(label, index) in track.labels" :key="index">
    <text v-if="showStartStop && label.isVisible" 
      data-test="bp-label"
      class="label small"
      :x="posX + width" 
      :y="label.svgY + LABEL_Y_OFFSET">
      - {{label.text}}
    </text>
  </template>

  <template v-if="lines">
    <template v-for="(line, index) in lines" :key="index">
      <line
        class="ortholog-line"
        @mouseenter="onMouseEnter($event, line, 'orthologLine')"
        @mouseleave="onMouseLeave(line, 'orthologLine')"
        :stroke="(line.isSelected ? SELECTED_HIGHLIGHT_COLOR : 'lightgray')"
        :x1="posX + width" :x2="line.comparativeGeneX"
        :y1="line.backboneGeneY" :y2="line.comparativeGeneY" />
    </template>
  </template>
  
  <!-- Gene Labels: only shown with ample offset-->
  <template v-for="(label, index) in track.geneLabels" :key="index">
    <text v-if="showGeneLabel && label.isVisible" 
      @mouseenter="onMouseEnter($event, label.section, 'geneLabel')"
      @mouseleave="onMouseLeave(label.section, 'geneLabel')"
      @click="onClick($event, label.section, 'geneLabel')"
      :class="(label.section.isSelected || label.section.showAltLabel ? 'bold-label' : 'label small')"
      :x="posX + width"
      :y="label.svgY + LABEL_Y_OFFSET">
      - {{getLabelText(label)}}
    </text>
  </template>

  <template v-for="(section, index) in track.sections" :key="index">
    <!-- Level 1 or unleveled section -->
    <rect v-if="section.shape !== 'line' && section.chainLevel !== 2"
      data-test="track-section-svg"
      class="section"
      @mouseenter="onMouseEnter($event, section, 'trackSection')"
      @mouseleave="onMouseLeave(section, 'trackSection')"
      @click="onClick($event, section, 'trackSection')"
      :fill="getSectionFill(section)"
      :fill-opacity="geneDataTrack ? .7 : 1"
      :x="posX" :y="section.svgY" 
      :width="width" 
      :height="section.height" />
    <!-- Level 1 Gaps -->
    <line v-else-if="section.shape === 'line' && section.chainLevel !== 2"
      data-test="track-section-svg"
      class="section gap"
      :x1="posX + (width / 2)" :x2="posX + (width / 2)" 
      :y1="section.svgY" :y2="section.svgY2" />
    <!-- Level 2 -->
    <rect v-else-if="section.shape !== 'line'"
      data-test="track-section-svg"
      class="section level-2"
      @mouseenter="onMouseEnter($event, section, 'trackSection')"
      @mouseleave="onMouseLeave(section, 'trackSection')"
      :fill="section.isHovered ? HOVER_HIGHLIGHT_COLOR : section.color"
      :x="posX + ((width * (1 - LEVEL_2_WIDTH_MULTIPLIER)) / 2)" :y="section.svgY" 
      :width="width * LEVEL_2_WIDTH_MULTIPLIER" 
      :height="section.height" />
    <!-- Level 2 Gaps -->
    <line v-else-if="section.shape === 'line'"
      data-test="track-section-svg"
      class="section gap"
      :x1="posX + (width / 2)" :x2="posX + (width / 2)" 
      :y1="section.svgY" :y2="section.svgY2" />

    <!-- Chromosome Label -->
    <text v-if="showChromosome && section.height > 15 && section.shape !== 'line'" 
      class="chromosome-label" 
      :x="posX + (width / 2)" 
      :y="section.svgY + (section.height / 2)"
      dominant-baseline="middle"
      text-anchor="middle">
      {{section.chromosome}}
    </text>

    <!-- Syntenic Lines -->
    <template v-if="showSyntenyOnHover">
      <line v-if="section.isHovered"
      class="section connection-line"
      :x1="posX + width" :x2="SVGConstants.backboneXPosition" 
      :y1="section.svgY" :y2="(section.isInverted) ? section.svgY2 : section.svgY" />
    <line v-if="section.isHovered"
      class="section connection-line"
      :x1="posX + width" :x2="SVGConstants.backboneXPosition" 
      :y1="section.svgY2" :y2="(section.isInverted) ? section.svgY : section.svgY2" />
    </template>
  </template>

  <rect class="panel" :x="SVGConstants.overviewPanelWidth" :width="SVGConstants.detailsPanelWidth" :height="SVGConstants.panelTitleHeight" />

</template>

<script lang="ts" setup>
import { watch, onMounted} from 'vue';
import SelectedData from '@/models/SelectedData';
import Track from '@/models/Track';
import OrthologLine from '@/models/OrthologLine';
import TrackSection from '@/models/TrackSection';
import { toRefs } from '@vue/reactivity';
import { useStore } from 'vuex';
import SVGConstants from '@/utils/SVGConstants';
import { getMousePosSVG } from '@/utils/SVGHelpers';
import { key } from '@/store';
import { sortGeneList, getNewSelectedData, getGeneOrthologIds } from '@/utils/DataPanelHelpers';

const LEVEL_2_WIDTH_MULTIPLIER = 0.75;
const LABEL_Y_OFFSET = 3;
const HOVER_HIGHLIGHT_COLOR = '#FF7C60';
const SELECTED_HIGHLIGHT_COLOR = '#FF4822';

const store = useStore(key);
const svg = document.querySelector('svg');

interface Props 
{
  showSyntenyOnHover?: boolean;
  showStartStop?: boolean;
  showChromosome?: boolean;
  showGeneLabel?: boolean;
  geneDataTrack?: boolean;
  posX: number;
  width: number;
  track: Track;
  lines?: OrthologLine[] | undefined;
}

const props = defineProps<Props>();

//Converts each property in this object to its own reactive prop
toRefs(props);

// update highlighting if selected genes change
watch(() => store.state.selectedGeneIds, () => {
  highlightSelections(store.state.selectedGeneIds);
});

// Set up highlighting on mount, to handle selection updates
onMounted(() => {
  highlightSelections(store.state.selectedGeneIds);
});

const onMouseEnter = (event: any, section: TrackSection, type: string) => {
  
  if (type === 'trackSection' || type === 'geneLabel') 
  {
    if (section)
    {
      section.isHovered = true;
    }
  }
  // If there are selected genes, don't update the selected data panel
  if (store.state.selectedGeneIds.length === 0) {
    const selectedData = new SelectedData(section, type);
    store.dispatch('setSelectedData', [selectedData]);
  }
};

const onMouseLeave = (section: TrackSection, type: string) => {
  if (type === 'trackSection' || type === 'geneLabel') 
  {
    if (section && section.isHovered == true)
    {
      section.isHovered = false;
    }
  }
  // Only reset data onMouseLeave if there isn't a selected gene
  if (store.state.selectedGeneIds.length === 0) {
    store.dispatch('setSelectedData', null);
  }
};

const onClick = (event: any, section: TrackSection, type: string) => {
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

const highlightSelections = (selectedGeneIds: number[]) => {
  // Look through the sections and highlight based on selected genes
  props.track.sections.forEach((section) => {
    if (checkSectionForGene(section, selectedGeneIds)) {
      section.isSelected = true;
    } else {
      section.isSelected = false;
    }
  });
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

const checkSectionForGene = (section: TrackSection, selectedGeneIds: number[]) => {
  if (selectedGeneIds.includes(section.gene?.rgdId || -1)) {
    return true;
  }
  if (section.hiddenGenes) {
    for (let i = 0; i < section.hiddenGenes.length; i++) {
      if(selectedGeneIds.includes(section.hiddenGenes[i].gene?.rgdId || -1)) {
        return true;
      }
    }
  }

  return false;
};

const getSectionFill = (section: TrackSection) => {
  if (section.isSelected) {return SELECTED_HIGHLIGHT_COLOR;}
  if (section.isHovered) {return HOVER_HIGHLIGHT_COLOR;}
  return section.color;
};

const getLabelText = (label: any) => {
  if (!label.section.showAltLabel) {
    return label.text;
  } else {
    const selectedGeneIds = store.state.selectedGeneIds;
    const altLabelOptions = label.section.altLabels.filter((label) => selectedGeneIds.includes(label.rgdId));
    let newLabelText = label.text;
    for (let i = 0; i < altLabelOptions.length; i++) {
      newLabelText = altLabelOptions[i].text;
      // For now, just find the first label not starting iwth LOC
      // Unless its the only selected gene available
      if (!newLabelText.startsWith('LOC')) {
        break;
      }
    }
    return newLabelText;
  }
};

</script>

<style lang="scss" scoped>
rect.panel
{
  fill: white;
  stroke-width: 2;
  stroke: lightgray;
}
.label.small
{
  font: normal 8px sans-serif;

  &:hover
  {
    cursor: pointer;
  }
}

.bold-label
{
  font: 8px sans-serif;
  font-weight: bold;

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