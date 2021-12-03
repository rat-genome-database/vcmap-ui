<template>
  <defs>
    <linearGradient id="selectedStripes" gradientUnits="userSpaceOnUse"
      x2="5" spreadMethod="repeat" gradientTransform="rotate(-45)">
      <stop offset="0" stop-color="gray"/>
      <stop offset="0.40" stop-color="gray"/>
      <stop offset="0.40" stop-color="lightgray"/>
      <stop offset="1.0" stop-color="lightgray"/>
    </linearGradient>
  </defs>

  <template v-for="(section, index) in track.sections" :key="index">
    <text v-if="showStartStop" 
      data-test="start-bp-label"
      class="label small" 
      :x="posX + width" 
      :y="getSectionYPosition(posY, index) + LABEL_Y_OFFSET">
      - {{section.startBPLabel}}
    </text>
    <rect 
      data-test="track-section-svg"
      class="section"
      :class="{'selectable': isSelectable}"
      @mouseenter="highlight(section)"
      @mouseleave="unhighlight(section)"
      @mousedown="initSelectStart($event, section, index)"
      @mousemove="updateSelectionHeight"
      @mouseup="completeSelect"
      :fill="section.isHighlighted && isHighlightable ? HIGHLIGHT_COLOR : section.color" 
      :x="posX" :y="getSectionYPosition(posY, index)" 
      :width="width" 
      :height="section.height" />
    <rect v-if="isSelectable && selectedRegion.svgHeight > 0"
      data-test="selected-region"
      fill="url(#selectedStripes)"
      stroke-width="1"
      stroke="black"
      :x="posX" :y="selectedRegion.svgYPoint"
      rx="2" ry="2"
      :width="width"
      :height="selectedRegion.svgHeight"
      @mousedown="initSelectStart($event, section, index)"
      @mousemove="updateSelectionHeight"
      @mouseup="completeSelect" />
    <text v-if="showStartStop" 
      data-test="stop-bp-label"
      class="label small" 
      :x="posX + width" 
      :y="getSectionYPosition(posY, index) + section.height + LABEL_Y_OFFSET">
      - {{section.stopBPLabel}}
    </text>
  </template>
</template>

<script lang="ts" setup>
import BackboneSelection from '@/models/BackboneSelection';
import Track from '@/models/Track';
import TrackSection from '@/models/TrackSection';
import { Resolution } from '@/utils/Resolution';
import { toRefs } from '@vue/reactivity';
import { onMounted, ref } from 'vue';
import { useStore } from 'vuex';

const LABEL_Y_OFFSET = 3;
const HIGHLIGHT_COLOR = 'aquamarine';
const store = useStore();
const svg = document.querySelector('svg');

// Flag to indicate whether or not the user is currently selecting a region on this track
let inSelectMode = false;
let selectedTrackSection: TrackSection;
let selectedTrackIndex: number;
let startingPoint: DOMPoint;

interface Props 
{
  isSelectable?: boolean;
  isHighlightable?: boolean;
  showStartStop?: boolean;
  posX: number;
  posY: number;
  width: number;
  track: Track;
}

const props = defineProps<Props>();

//Converts each property in this object to its own reactive prop
toRefs(props);
let selectedRegion = ref<BackboneSelection>(
  new BackboneSelection(0, 0, 0, 0)
);

onMounted(() => {
  selectedRegion.value = store.getters.getSelectedBackboneRegion ?? new BackboneSelection(0, 0, 0, 0);
});

/**
 * Gets the starting Y position of each track section based on the height of the previous section
 * and any offsets that might need to be applied for gaps.
 */
const getSectionYPosition = (startingYPos: number, sectionIndex: number) => {
  let currentYPos = startingYPos;
  let previousSectionIndex = sectionIndex - 1;
  while (previousSectionIndex >= 0 && sectionIndex !== 0)
  {
    let previousTrackSection = props.track.sections[previousSectionIndex];
    currentYPos += previousTrackSection.height + previousTrackSection.offsetHeight;
    previousSectionIndex--;
  }

  // Add offset if one is defined
  currentYPos += props.track.sections[sectionIndex].offsetHeight;
  return currentYPos;
};

const initSelectStart = (event: any, section: TrackSection, sectionIndex: number) => {
  if (!props.isSelectable) return;

  if (inSelectMode)
  {
    return completeSelect();
  }

  // Begin selection mode
  inSelectMode = true;
  selectedTrackSection = section;
  selectedTrackIndex = sectionIndex;
  selectedRegion.value = new BackboneSelection(0, 0, 0, 0);

  let currentSVGPoint = getMousePosSVG(event) as DOMPoint;
  startingPoint = currentSVGPoint;
  selectedRegion.value.svgYPoint = currentSVGPoint.y;
  selectedRegion.value.svgHeight = 0;
};

const updateSelectionHeight = (event: any) => {
  if (!props.isSelectable || !inSelectMode) return;

  let currentSVGPoint = getMousePosSVG(event) as DOMPoint;

  if (currentSVGPoint.y < startingPoint.y)
  {
    // We are moving above the starting point, calculate height with the starting point as the largest y value
    selectedRegion.value.svgYPoint = currentSVGPoint.y;
    selectedRegion.value.svgHeight =  startingPoint.y - selectedRegion.value.svgYPoint;
  }
  else
  {
    // We are moving below the starting point, calculate height with the current point as the largest y value
    selectedRegion.value.svgHeight = currentSVGPoint.y - selectedRegion.value.svgYPoint;
  }
};

const completeSelect = () => {
  if (!props.isSelectable || !inSelectMode) return;

  inSelectMode = false;

  if (selectedRegion.value.svgHeight > 0 && selectedTrackSection)
  {
    // Calculate the selected range in base pairs
    const totalBasePairsSelected = Math.ceil(selectedRegion.value.svgHeight * Resolution.BackbonePanel.getBasePairToHeightRatio());
    const basePairsUpToStart = Math.floor((selectedRegion.value.svgYPoint - getSectionYPosition(props.posY, selectedTrackIndex)) * Resolution.BackbonePanel.getBasePairToHeightRatio());
    const basePairStart = selectedTrackSection.backboneStart + basePairsUpToStart;
    selectedRegion.value.basePairStart = basePairStart;
    selectedRegion.value.basePairStop = basePairStart + totalBasePairsSelected;
  }

  store.dispatch('setSelectedBackboneRegion', selectedRegion.value);
};

const highlight = (section: TrackSection) => {
  section.isHighlighted = true;
};

const unhighlight = (section: TrackSection) => {
  section.isHighlighted = false;
};

/**
 * Helper method to get the coordinates of the event in the SVG viewbox
 */
const getMousePosSVG = (e: any) => {
  if (!svg) return 0;

  let p = svg.createSVGPoint();
  p.x = e.clientX;
  p.y = e.clientY;
  let ctm = svg.getScreenCTM()?.inverse();
  p = p.matrixTransform(ctm);
  return p;
}
</script>

<style lang="scss" scoped>
.label.small
{
  font: normal 8px sans-serif;
}

.section
{
  stroke-width: 0;
  &.selectable:hover
  {
    cursor: crosshair;
  }
}
</style>