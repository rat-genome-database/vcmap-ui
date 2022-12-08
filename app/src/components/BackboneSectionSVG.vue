<template>
  <!-- BackboneSection SVG -->
  <rect v-if="backbone"
    data-test="track-section-svg"
    class="section"
    @mouseenter="onMouseEnter($event, backbone)"
    @mouseleave="onMouseLeave(backbone)"
    :fill="backbone.isHovered && showDataOnHover ? HIGHLIGHT_COLOR : backbone.elementColor"
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
import SelectedData from '@/models/SelectedData';
import { toRefs } from '@vue/reactivity';
import { ref, watch } from 'vue';
import { useStore } from 'vuex';
import SVGConstants from '@/utils/SVGConstants';
import { key } from '@/store';
import { Formatter } from '@/utils/Formatter';
import BackboneSection from '@/new_models/BackboneSection';

const INNER_SELECTION_EXTRA_WIDTH = 4;
const HIGHLIGHT_COLOR = 'bisque';

const store = useStore(key);

interface Props
{
  showDataOnHover?: boolean;
  backbone: BackboneSection;
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

const onMouseEnter = (event: any, section: BackboneSection) => {
  
  if (section)
  {
    section.isHovered = true;
  }

  // Only set selected data if there are no selected genes
  if (store.state.selectedGeneIds.length === 0)
  {
    const selectedData = new SelectedData(section.toSelectedData(), 'backbone');
    store.dispatch('setSelectedData', [selectedData]);
  }
};

const onMouseLeave = (section: BackboneSection) => {
  if (section && section.isHovered == true)
  {
    section.isHovered = false;
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
