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

  <!-- Gene Labels: only shown with ample offset-->
  <template v-for="(label, index) in track.geneLabels" :key="index">
    <text v-if="showGeneLabel && label.isVisible" 
      @mouseenter="onMouseEnter($event, label.section, 'geneLabel')"
      @mouseleave="onMouseLeave(label.section, 'geneLabel')"
      @click="onClick($event, label.section, 'geneLabel')"
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
        :stroke="(line.isSelected ? SELECTED_HIGHLIGHT_COLOR : 'gray')"
        :x1="posX + width" :x2="line.comparativeGeneX"
        :y1="line.backboneGeneY" :y2="line.comparativeGeneY" />
    </template>
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
  let foundLine = false;
  const newSelectedData = [new SelectedData(section, type)];
  props.lines?.forEach((line) => {
    if (line.backboneGene.gene?.rgdId === section.gene?.rgdId) {
      foundLine = true;
      let sectionGeneId = section.gene?.rgdId;
      let comparativeGeneId = line.comparativeGene.gene?.rgdId;
      newSelectedData.push(new SelectedData(line.comparativeGene.gene, 'Gene'));
      if (sectionGeneId && !geneIds.includes(sectionGeneId)) {
        geneIds.push(sectionGeneId);
      }
      if (comparativeGeneId && !geneIds.includes(comparativeGeneId)) {
        geneIds.push(comparativeGeneId);
      }
      store.dispatch('setSelectedGeneIds', geneIds);
    }
  });
  if (!foundLine) {
    geneIds.push(section.gene?.rgdId || -1);
    store.dispatch('setSelectedGeneIds', geneIds || []);
  }
  if (event.shiftKey) {
    const selectedDataArray = [...store.state.selectedData, ...newSelectedData];
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
  if (section.combinedGenes) {
    for (let i = 0; i < section.combinedGenes.length; i++) {
      if(selectedGeneIds.includes(section.combinedGenes[i].gene?.rgdId || -1)) {
        return true;
      }
    }
  }

  return false;
}

const getSectionFill = (section: TrackSection) => {
  if (section.isSelected) {return SELECTED_HIGHLIGHT_COLOR;}
  if (section.isHovered) {return HOVER_HIGHLIGHT_COLOR;}
  return section.color;
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