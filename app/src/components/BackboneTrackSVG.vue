<template>
  <template v-for="(section, index) in track.sections" :key="index">

    <!-- Track SVG -->
    <rect v-if="section.shape !== 'line'"
      data-test="track-section-svg"
      class="section"
      @mouseenter="onMouseEnter($event, section, 'trackSection')"
      @mouseleave="onMouseLeave(section, 'trackSection')"
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

    <!-- BP labels -->
    <template v-for="(label, index) in track.labels" :key="index">
      <text v-if="label.isVisible"
        data-test="bp-label"
        class="label small"
        :x="posX - (SVGConstants.trackWidth/2)"
        :y="getAdjustedLabelY(label, index)">
        {{label.text}}
      </text>
    </template>

    <!-- Selected Region on Track -->
    <rect v-if="!isDetailed && selectedRegion.baseSelection.svgHeight > 0"
      data-test="selected-region"
      class="selected-region"
      fill="#000"
      fill-opacity="0.3"
      stroke="#333"
      stroke-width="1"
      :x="posX" :y="selectedRegion.baseSelection.svgYPoint"
      :width="SVGConstants.trackWidth"
      :height="selectedRegion.baseSelection.svgHeight" />

    <!-- Inner selection that changes depending on Detailed panel zoom -->
    <rect v-if="!isDetailed && selectedRegion.innerSelection && selectedRegion.innerSelection.svgHeight > 0"
      stroke="green"
      fill="green"
      fill-opacity="0.5"
      :x="posX - 2" :y="selectedRegion.innerSelection.svgYPoint"
      :width="SVGConstants.trackWidth + INNER_SELECTION_EXTRA_WIDTH"
      :height="selectedRegion.innerSelection.svgHeight" />
  </template>

</template>

<script lang="ts" setup>
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import SelectedData from '@/models/SelectedData';
import Track, { Label } from '@/models/Track';
import TrackSection from '@/models/TrackSection';
import { toRefs } from '@vue/reactivity';
import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import SVGConstants from '@/utils/SVGConstants';
import { getMousePosSVG } from '@/utils/SVGHelpers';
import { key } from '@/store';

const INNER_SELECTION_EXTRA_WIDTH = 4;
const START_LABEL_Y_OFFSET = -3;
const END_LABEL_Y_OFFSET = 7;
const HIGHLIGHT_COLOR = 'bisque';

const store = useStore(key);
const svg = document.querySelector('svg');

interface Props
{
  showDataOnHover?: boolean;
  posX: number;
  track: Track;
  isDetailed?: boolean;
}

const props = defineProps<Props>();

//Converts each property in this object to its own reactive prop
toRefs(props);
const selectedRegion = ref(new BackboneSelection(new SelectedRegion(0,0,0,0), store.state.chromosome ?? undefined));

watch(() => store.state.selectedBackboneRegion, (newVal: BackboneSelection, oldVal: BackboneSelection) => {
  // Watch for possible clear out of the selected backbone region
  if (!props.isDetailed && oldVal.baseSelection.svgHeight > 0 && newVal.baseSelection.svgHeight === 0)
  {
    selectedRegion.value = new BackboneSelection(new SelectedRegion(0,0,0,0), store.state.chromosome ?? undefined);
  }
  else if (!props.isDetailed && newVal.baseSelection.svgHeight > 0)
  {
    selectedRegion.value = newVal;
  }
}, { deep: true });

const getAdjustedLabelY = (label: Label, index: number) => {
  if (props.isDetailed)
  {
    if (label.svgY - SVGConstants.panelTitleHeight < 10)
    {
      return label.svgY + 3;
    }
    else if (label.svgY - (SVGConstants.panelTitleHeight + (SVGConstants.viewboxHeight -  SVGConstants.navigationButtonHeight)) < 10)
    {
      return label.svgY;
    }
  }

  return index > 0 ? label.svgY + END_LABEL_Y_OFFSET : label.svgY + START_LABEL_Y_OFFSET;
};

const onMouseEnter = (event: any, section: TrackSection, type: string) => {
  
  if (type === 'trackSection' || type === 'geneLabel') 
  {
    if (section)
    {
      section.isHovered = true;
    }
  }
  // Only set selected data if there are no selected genes
  if (store.state.selectedGeneIds.length === 0) {
    let currentSVGPoint = getMousePosSVG(svg, event);
    const selectedData = new SelectedData(props.posX, currentSVGPoint.x, currentSVGPoint.y, section, type);
    store.dispatch('setSelectedData', selectedData);
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
  // Only reset selected data if there are no selected genes
  if (store.state.selectedGeneIds.length === 0) {
    store.dispatch('setSelectedData', null);
  }
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
  fill: #4c4b4b;
}

.section
{
  stroke-width: 0;
  &.gap
  {
    stroke-width: 1;
    stroke: black;
  }
}

.selected-region
{
  stroke-width: 1;
}
</style>
