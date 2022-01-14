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
    <!-- Start BP label: Only show if there is enough of an offset b/w this section and the previous section-->
    <text v-if="showStartStop && (section.offsetHeight > 10 || index === 0)" 
      data-test="start-bp-label"
      class="label small" 
      :x="posX + width" 
      :y="section.svgY + LABEL_Y_OFFSET">
      - {{section.startBPLabel}}
    </text>

    <!-- Gene Labels: only shown with ample offset-->
    <text v-if="showGeneLabel && (section.offsetHeight > 6 || index === 0)" 
      class="label small" 
      @mouseenter="onMouseEnter($event, section, true)"
      @mouseleave="onMouseLeave(section)"
      :x="posX + width" 
      :y="section.svgY + LABEL_Y_OFFSET">
      - {{section.geneLabel}}
    </text>

    <!-- Track SVG -->
    <rect v-if="section.shape !== 'line'"
      data-test="track-section-svg"
      class="section"
      @mouseenter="onMouseEnter($event, section, false)"
      @mouseleave="onMouseLeave(section)"
      :fill="section.isHovered ? HIGHLIGHT_COLOR : section.color" 
      :x="posX" :y="section.svgY" 
      :width="width" 
      :height="section.height" />
    <line v-else
      data-test="track-section-svg"
      class="section gap"
      :x1="posX + (width / 2)" :x2="posX + (width / 2)" 
      :y1="section.svgY" :y2="section.svgY + section.height" />

    <!-- Chromosome Label -->
    <text v-if="showChromosome && section.height > 15 && section.shape !== 'line'" 
      class="chromosome-label" 
      :x="posX + (width / 2)" 
      :y="section.svgY + (section.height / 2)"
      dominant-baseline="middle"
      text-anchor="middle">
      {{section.chromosome}}
    </text>

    <!-- Stop Label: Only show if the section is big enough so that it doesn't overlap with the start label -->
    <text v-if="showStartStop && section.height > 10" 
      data-test="stop-bp-label"
      class="label small" 
      :x="posX + width" 
      :y="section.svgY + section.height + LABEL_Y_OFFSET">
      - {{section.stopBPLabel}}
    </text>

    <!-- Syntenic Lines -->
    <template v-if="showSyntenyOnHover">
      <line v-if="section.isHovered"
      class="section connection-line"
      :x1="posX + width" :x2="SVGConstants.backboneXPosition" 
      :y1="section.svgY" :y2="section.svgY" />
    <line v-if="section.isHovered"
      class="section connection-line"
      :x1="posX + width" :x2="SVGConstants.backboneXPosition" 
      :y1="section.svgY + section.height" :y2="section.svgY + section.height" />
    </template>
  </template>
</template>

<script lang="ts" setup>
import TooltipData from '@/models/TooltipData';
import Track from '@/models/Track';
import TrackSection from '@/models/TrackSection';
import { toRefs } from '@vue/reactivity';
import { useStore } from 'vuex';
import SVGConstants from '@/utils/SVGConstants';
import { getMousePosSVG } from '@/utils/SVGHelpers';

const LABEL_Y_OFFSET = 3;
const HIGHLIGHT_COLOR = 'bisque';

const store = useStore();
const svg = document.querySelector('svg');

interface Props 
{
  showSyntenyOnHover?: boolean;
  showStartStop?: boolean;
  showChromosome?: boolean;
  showGeneLabel?: boolean;
  posX: number;
  width: number;
  track: Track;
}

const props = defineProps<Props>();

//Converts each property in this object to its own reactive prop
toRefs(props);

const onMouseEnter = (event: any, section: TrackSection, isGeneLabel: boolean) => {
  section.isHovered = true;

  // If is a gene label but has no hidden genes, show nothing 
  if (isGeneLabel)
  {
    if (!section.hiddenGenes || section.hiddenGenes.length <= 0)
    {
      return;
    } 
  }

  let currentSVGPoint = getMousePosSVG(svg, event);
  const tooltipData = new TooltipData(props.posX, currentSVGPoint.y, section, isGeneLabel);
  store.dispatch('setTooltipData', tooltipData);
};

const onMouseLeave = (section: TrackSection) => {
  section.isHovered = false;
  store.dispatch('setTooltipData', null);
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
}
</style>