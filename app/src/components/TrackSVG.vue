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
        :stroke="checkForSelectedGene(line)"
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
      :fill="(section.isHovered || section.isSelected) ? HIGHLIGHT_COLOR : section.color"
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
      :fill="section.isHovered ? HIGHLIGHT_COLOR : section.color"
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
import { watch } from 'vue';
import TooltipData from '@/models/TooltipData';
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
const HIGHLIGHT_COLOR = 'bisque';

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

watch(() => store.state.selectedGeneId, () => {
  // TODO: When selected gene changes, get the relvant line and connected genes
  if (props.lines)
    props.lines?.forEach((line) => {
      if (line.backboneGene.gene?.rgdId === store.state.selectedGeneId ||
        line.comparativeGene.gene?.rgdId === store.state.selectedGeneId) {
        line.backboneGene.isSelected = true;
        line.comparativeGene.isSelected = true;
      } else {
        line.backboneGene.isSelected = false;
        line.comparativeGene.isSelected = false;
      }
    });
});

const onMouseEnter = (event: any, section: TrackSection, type: string) => {
  
  if (type === 'trackSection' || type === 'geneLabel') 
  {
    if (section)
    {
      section.isHovered = true;
    }
  }
  let currentSVGPoint = getMousePosSVG(svg, event);
  const tooltipData = new TooltipData(props.posX, currentSVGPoint.x, currentSVGPoint.y, section, type);
  store.dispatch('setTooltipData', tooltipData);
};

const onMouseLeave = (section: TrackSection, type: string) => {
  if (type === 'trackSection' || type === 'geneLabel') 
  {
    if (section && section.isHovered == true)
    {
      section.isHovered = false;
    }
  }
  store.dispatch('setTooltipData', null);
};

const onClick = (event: any, section: TrackSection, type: string) => {
  section.isSelected = !section.isSelected;
  // TODO: probably set tooltip too?
  store.dispatch('setSelectedGeneId', section.gene?.rgdId || -1);
};

const checkForSelectedGene = (line: OrthologLine): string => {
  if (line.backboneGene.gene?.rgdId === store.state.selectedGeneId ||
      line.comparativeGene.gene?.rgdId === store.state.selectedGeneId) {
    return HIGHLIGHT_COLOR;
  }
  return 'gray';
};

/* const tooltipClick = (event: any, section: TrackSection, type: string) => {
  let currentSVGPoint = getMousePosSVG(svg, event);
  const tooltipData = new TooltipData(props.posX, currentSVGPoint.y, section, type);
  store.dispatch('setTooltipData', tooltipData);
}; */
</script>

<style lang="scss" scoped>
.label.small
{
  font: normal 8px sans-serif;
}

.chromosome-label
{
  font: normal 12px sans-serif;
  fill: #4c4b4b;
}

.ortholog-line
{
  stroke-width: 1;
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
}
</style>