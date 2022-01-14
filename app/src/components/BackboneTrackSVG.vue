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

  <template v-for="(section, index) in track.sections" :key="index">
    <!-- Start BP label -->
    <text
      data-test="start-bp-label"
      class="label small" 
      :x="posX + SVGConstants.trackWidth" 
      :y="section.svgY + LABEL_Y_OFFSET">
      - {{section.startBPLabel}}
    </text>

    <!-- Track SVG -->
    <rect v-if="section.shape !== 'line'"
      data-test="track-section-svg"
      class="section"
      :class="{'selectable': isSelectable}"
      @mouseenter="onMouseEnter($event, section)"
      @mouseleave="onMouseLeave(section)"
      @mousedown="initSelectStart($event, section, index)"
      @mousemove="updateSelectionHeight"
      :fill="section.isHovered && showDataOnHover ? HIGHLIGHT_COLOR : section.color" 
      :x="posX" :y="section.svgY" 
      :width="SVGConstants.trackWidth" 
      :height="section.height" />
    <line v-else
      data-test="track-section-svg"
      class="section gap"
      :x1="posX + (SVGConstants.trackWidth / 2)" :x2="posX + (SVGConstants.trackWidth / 2)" 
      :y1="section.svgY" :y2="section.svgY + section.height" />

    <!-- Chromosome Label -->
    <text v-if="section.shape !== 'line'" 
      class="chromosome-label" 
      :x="posX + (SVGConstants.trackWidth / 2)" 
      :y="section.svgY + (section.height / 2)"
      dominant-baseline="middle"
      text-anchor="middle">
      {{section.chromosome}}
    </text>

    <!-- Selected Region on Track -->
    <rect v-if="isSelectable && selectedRegion.svgHeight > 0"
      data-test="selected-region"
      class="selected-region"
      fill="url(#selectedStripes)"
      stroke="black"
      :x="posX" :y="selectedRegion.svgYPoint"
      rx="2" ry="2"
      :width="SVGConstants.trackWidth"
      :height="selectedRegion.svgHeight"
      @mousedown="initSelectStart($event, section, index)"
      @mousemove="updateSelectionHeight" />

    <!-- Stop Label -->
    <text
      data-test="stop-bp-label"
      class="label small" 
      :x="posX + SVGConstants.trackWidth" 
      :y="section.svgY + section.height + LABEL_Y_OFFSET">
      - {{section.stopBPLabel}}
    </text>
  </template>
</template>

<script lang="ts" setup>
import BackboneSelection from '@/models/BackboneSelection';
import TooltipData from '@/models/TooltipData';
import Track from '@/models/Track';
import TrackSection from '@/models/TrackSection';
import { toRefs } from '@vue/reactivity';
import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import SVGConstants from '@/utils/SVGConstants';

const LABEL_Y_OFFSET = 3;
const HIGHLIGHT_COLOR = 'bisque';

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
  showDataOnHover?: boolean;
  posX: number;
  track: Track;
}

const props = defineProps<Props>();

//Converts each property in this object to its own reactive prop
toRefs(props);
const selectedRegion = ref(new BackboneSelection(0, 0, 0, 0));

watch(() => props.track, () => {
  if (props.isSelectable && store.getters.getSelectedBackboneRegion)
  {
    // There was an existing selection on this track so let's recreate it
    const selection = store.getters.getSelectedBackboneRegion as BackboneSelection;
    const startingYPos = SVGConstants.trackYPosition;

    const selectionStart = (selection.basePairStart < store.getters.getDisplayStartPosition) ? store.getters.getDisplayStartPosition : selection.basePairStart;
    const selectionStop = (selection.basePairStop > store.getters.getDisplayStopPosition) ? store.getters.getDisplayStopPosition : selection.basePairStop;
    
    selection.svgHeight = (selectionStop - selectionStart) / store.getters.getBackboneBasePairToHeightRatio;
    selection.svgYPoint = ((selectionStart - store.getters.getDisplayStartPosition) / store.getters.getBackboneBasePairToHeightRatio) + startingYPos;
    selectedRegion.value = selection;
    store.dispatch('setSelectedBackboneRegion', selectedRegion.value);
  }
});

watch(() => store.getters.getSelectedBackboneRegion, (newVal, oldVal) => {
  // Watch for possible clear out of the selected backbone region
  if (props.isSelectable && oldVal != null && newVal == null)
  {
    selectedRegion.value = new BackboneSelection(0, 0, 0, 0);
  }
});

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
    const totalBasePairsSelected = Math.ceil(selectedRegion.value.svgHeight * store.getters.getBackboneBasePairToHeightRatio);
    const basePairsUpToStart = Math.floor((selectedRegion.value.svgYPoint - props.track.sections[selectedTrackIndex].svgY) * store.getters.getBackboneBasePairToHeightRatio);
    const basePairStart = selectedTrackSection.backboneStart + basePairsUpToStart;
    selectedRegion.value.basePairStart = basePairStart;
    selectedRegion.value.basePairStop = basePairStart + totalBasePairsSelected;
  }

  store.dispatch('setSelectedBackboneRegion', selectedRegion.value);
};

const onMouseEnter = (event: any, section: TrackSection) => {
  section.isHovered = true;

  // Show data tooltip on hover
  if (props.showDataOnHover)
  {
    let currentSVGPoint = getMousePosSVG(event) as DOMPoint;
    const tooltipData = new TooltipData(props.posX, currentSVGPoint.y, section, false);
    store.dispatch('setTooltipData', tooltipData);
  }
};

const onMouseLeave = (section: TrackSection) => {
  section.isHovered = false;
  store.dispatch('setTooltipData', null);
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
};
</script>

<style lang="scss" scoped>
.label.small
{
  font: normal 8px sans-serif;
}

.chromosome-label
{
  font: normal 12px sans-serif;
  fill: white;
}

.section
{
  stroke-width: 0;
  &.selectable
  {
    cursor: crosshair;
  }
  &.gap
  {
    stroke-width: 1;
    stroke: black;
  }
}

.selected-region
{
  stroke-width: 1;
  cursor: crosshair;
}
</style>