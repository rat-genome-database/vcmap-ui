<template>
  <!-- BackboneSection SVG -->
  <rect v-if="backbone"
    data-test="track-section-svg"
    class="section"
    @mouseenter="onMouseEnter(backbone, 'backbone')"
    @mouseleave="onMouseLeave(backbone)"
    :fill="backbone.isHovered && showDataOnHover ? HOVER_HIGHLIGHT_COLOR : backbone.elementColor"
    :x="backbone.posX1" :y="backbone.posY1"
    :width="backbone.width"
    :height="backbone.height" />

  <!-- Chromosome Label -->
  <text v-if="backbone"
    class="chromosome-label"
    :x="backbone.posX1 + (SVGConstants.trackWidth / 2)"
    :y="backbone.posY1 + (backbone.height / 2)"
    dominant-baseline="middle"
    text-anchor="middle">
    {{backbone.chromosome}}
  </text>

  <!-- BP labels -->
  <template v-for="(label, index) in backbone.labels" :key="index">
    <text v-if="label.isVisible"
      data-test="bp-label"
      class="label small"
      :x="label.posX"
      :y="label.posY">
      {{label.text}}
    </text>
  </template>

  <!-- Datatracks -->
  <template v-for="(datatrack, index) in datatracks" :key="index">
    <rect
      class="block-section"
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

  <!-- Selected Region on Track -->
  <rect v-if="!isDetailed && selectedRegion.baseSelection.svgHeight > 0"
    data-test="selected-region"
    class="selected-region"
    fill="#000"
    fill-opacity="0.3"
    stroke="#333"
    stroke-width="1"
    :x="backbone.posX1" :y="selectedRegion.baseSelection.svgYPoint"
    :width="SVGConstants.trackWidth"
    :height="selectedRegion.baseSelection.svgHeight" />

  <!-- Inner selection that changes depending on Detailed panel zoom -->
  <rect v-if="!isDetailed && selectedRegion.innerSelection && selectedRegion.innerSelection.svgHeight > 0"
    stroke="green"
    fill="green"
    fill-opacity="0.5"
    :x="backbone.posX1 - 2" :y="selectedRegion.innerSelection.svgYPoint"
    :width="SVGConstants.trackWidth + INNER_SELECTION_EXTRA_WIDTH"
    :height="selectedRegion.innerSelection.svgHeight" />
    
  <text v-if="!isDetailed && selectedRegion.baseSelection.svgYPoint > 75"
    class="label small"
    :x="backbone.posX1 - 3"
    :y="selectedRegion.baseSelection.svgYPoint - 1">
      {{ Formatter.convertBasePairToLabel(selectedRegion.baseSelection.basePairStart) }}
  </text>

  <text v-if="!isDetailed && (selectedRegion.baseSelection.svgYPoint + selectedRegion.baseSelection.svgHeight) < 405"
    class="label small"
    :x="backbone.posX1 - 3"
    :y="selectedRegion.baseSelection.svgYPoint + selectedRegion.baseSelection.svgHeight + 6">
      {{ Formatter.convertBasePairToLabel(selectedRegion.baseSelection.basePairStop) }}
  </text>

  <template v-if="(!isDetailed && selectedRegion.innerSelection)">
    <text v-if="!isDetailed && selectedRegion.innerSelection?.svgHeight > 0 && selectedRegion.innerSelection?.svgYPoint - selectedRegion.baseSelection.svgYPoint > 6"
      class="label small"
      :x="backbone.posX1 - 3"
      :y="selectedRegion.innerSelection?.svgYPoint - 1">
        {{ Formatter.convertBasePairToLabel(selectedRegion.innerSelection.basePairStart) }}
    </text>
    
    <text v-if="!isDetailed && selectedRegion.innerSelection?.svgHeight >= 6 && ((selectedRegion.baseSelection.svgYPoint + selectedRegion.baseSelection.svgHeight + 6) - (selectedRegion.innerSelection.svgYPoint + selectedRegion.innerSelection.svgHeight + 6) > 6)"
      class="label small"
      :x="backbone.posX1 - 3"
      :y="selectedRegion.innerSelection?.svgYPoint + selectedRegion.innerSelection.svgHeight + 6">
        {{ Formatter.convertBasePairToLabel(selectedRegion.innerSelection.basePairStop) }}
    </text>
  </template>
</template>

<script lang="ts" setup>
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import SelectedData, { SelectedDataType } from '@/models/SelectedData';
import { computed, toRefs } from '@vue/reactivity';
import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import SVGConstants from '@/utils/SVGConstants';
import { key } from '@/store';
import { Formatter } from '@/utils/Formatter';
import BackboneSection from '@/new_models/BackboneSection';
import BackboneSet from '@/new_models/BackboneSet';
import DatatrackSection from '@/new_models/DatatrackSection';
import { VCMapSVGElement } from '@/new_models/VCMapSVGElement';

const INNER_SELECTION_EXTRA_WIDTH = 4;
const HOVER_HIGHLIGHT_COLOR = '#FF7C60';
const SELECTED_HIGHLIGHT_COLOR = '#FF4822';

const store = useStore(key);

interface Props
{
  showDataOnHover?: boolean;
  backboneSet: BackboneSet;
}

const props = defineProps<Props>();

const backbone = computed(() => {
  return props.backboneSet.backbone;
});

const datatracks = computed(() => {
  return props.backboneSet.datatracks;
});

const isDetailed = computed(() => {
  return props.backboneSet.backbone.renderType === 'detailed';
});

//Converts each property in this object to its own reactive prop
toRefs(props);
const selectedRegion = ref(new BackboneSelection(new SelectedRegion(0,0,0,0), store.state.chromosome ?? undefined));

watch(() => store.state.selectedBackboneRegion, (newVal: BackboneSelection, oldVal: BackboneSelection) => {
  console.log('in watch', isDetailed);
  // Watch for possible clear out of the selected backbone region
  if (!isDetailed.value && oldVal.baseSelection.svgHeight > 0 && newVal.baseSelection.svgHeight === 0)
  {
    selectedRegion.value = new BackboneSelection(new SelectedRegion(0,0,0,0), store.state.chromosome ?? undefined);
  }
  else if (!isDetailed.value && newVal.baseSelection.svgHeight > 0)
  {
    selectedRegion.value = newVal;
  }
}, { deep: true });

const onMouseEnter = (section: BackboneSection | DatatrackSection, type: SelectedDataType) => {
  
  if (section)
  {
    section.isHovered = true;
  }

  // Only set selected data if there are no selected genes
  if (store.state.selectedGeneIds.length === 0)
  {
    const selectedData = new SelectedData(section, type);
    store.dispatch('setSelectedData', [selectedData]);
  }
};

const onMouseLeave = (section: BackboneSection | DatatrackSection) => {
  if (section && section.isHovered == true)
  {
    section.isHovered = false;
  }

  // Only reset selected data if there are no selected genes
  if (store.state.selectedGeneIds.length === 0) {
    store.dispatch('setSelectedData', null);
  }
};

const getSectionFill = (section: VCMapSVGElement) => {
  if (section.isSelected) {return SELECTED_HIGHLIGHT_COLOR;}
  if (section.isHovered) {return HOVER_HIGHLIGHT_COLOR;}
  return section.elementColor;
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
