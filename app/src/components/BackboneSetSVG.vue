<template>
  <!-- BackboneSection SVG -->
  <rect v-if="backbone"
    data-test="track-section-svg"
    class="section"
    @mouseenter="() => onMouseEnter(backbone, 'backbone')"
    @mouseleave="() => onMouseLeave(backbone)"
    @mousemove="updatePositionLabel($event)"
    :fill="backbone.isHovered && showDataOnHover ? HOVER_HIGHLIGHT_COLOR : backbone.elementColor"
    :x="backbone.posX1" :y="backbone.posY1"
    :width="backbone.width"
    :height="backbone.height" />

  <!-- Chromosome Label -->
  <text v-if="backbone"
    class="chromosome-label"
    :x="backbone.posX1 + (SVGConstants.trackWidth / 2)"
    :y="backbone.windowSVGMiddle"
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

  <!-- TODO: This will likely be its own component soon to handle different datatrack types -->
  <!-- Datatracks -->
  <template v-for="(datatrackSet, index) in datatrackSets" :key="index">
    <template v-for="(datatrack, index) in datatrackSet.datatracks" :key="index">
      <rect
        class="section clickable"
        @mouseenter="() => onMouseEnter(datatrack, 'Gene')"
        @mouseleave="() => onMouseLeave(datatrack)"
        @click="onClick($event, datatrack)"

        :y="datatrack.posY1"
        :x="datatrack.posX1"
        :width="datatrack.width"
        :height="datatrack.height"
        :fill="getSectionFill(datatrack)"
        :fill-opacity=".7"
      />
    </template>
  </template>

  <!-- Inner selection that changes depending on Detailed panel zoom -->
  <rect v-if="!isDetailed && selectedRegion.viewportSelection != null && selectedRegion.viewportSelection.svgHeight > 0"
    stroke="green"
    fill="green"
    fill-opacity="0.5"
    :x="backbone.posX1 - 2" :y="selectedRegion.viewportSelection.svgYPoint"
    :width="SVGConstants.trackWidth + INNER_SELECTION_EXTRA_WIDTH"
    :height="selectedRegion.viewportSelection.svgHeight" />

  <template v-if="!isDetailed && selectedRegion.viewportSelection != null && selectedRegion.viewportSelection.svgHeight > 0">
    <text v-if="selectedRegion.viewportSelection.svgYPoint > backbone.posY1 + 10"
      class="label small"
      :x="backbone.posX1 - 5"
      :y="selectedRegion.viewportSelection.svgYPoint - 2">
        {{ Formatter.convertBasePairToLabel(selectedRegion.viewportSelection.basePairStart) }}
    </text>
    
    <text v-if="selectedRegion.viewportSelection.svgYPoint + selectedRegion.viewportSelection.svgHeight < backbone.posY2 - 10"
      class="label small"
      :x="backbone.posX1 - 5"
      :y="selectedRegion.viewportSelection.svgYPoint + selectedRegion.viewportSelection.svgHeight + 7">
        {{ Formatter.convertBasePairToLabel(selectedRegion.viewportSelection.basePairStop) }}
    </text>
  </template>

  <template v-if="mouseYPos && backbone.isHovered && isDetailed">
    <text
      class="label small"
      text-anchor="end"
      dominant-baseline="middle"
      :x="backbone.posX1 - 1"
      :y="mouseYPos"
    >
      {{ basePairPositionLabel }}
    </text>
    <line
      class="position-label"
      :x1="backbone.posX1"
      :x2="backbone.posX1 + backbone.width"
      :y1="mouseYPos"
      :y2="mouseYPos"
    />
  </template>
</template>

<script lang="ts" setup>
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import SelectedData, { SelectedDataType } from '@/models/SelectedData';
import { getNewSelectedData } from '@/utils/DataPanelHelpers';
import { computed, toRefs } from '@vue/reactivity';
import { ref, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import SVGConstants from '@/utils/SVGConstants';
import { key } from '@/store';
import { Formatter } from '@/utils/Formatter';
import BackboneSection from '@/models/BackboneSection';
import BackboneSet from '@/models/BackboneSet';
import DatatrackSection, { GeneDatatrack } from '@/models/DatatrackSection';
import { VCMapSVGElement } from '@/models/VCMapSVGElement';
import useMouseBasePairPos from '@/composables/useMouseBasePairPos';

const INNER_SELECTION_EXTRA_WIDTH = 4;
const HOVER_HIGHLIGHT_COLOR = '#FF7C60';
const SELECTED_HIGHLIGHT_COLOR = '#FF4822';

const store = useStore(key);

const { getBasePairPositionFromSVG, mouseYPos, } = useMouseBasePairPos();

interface Props
{
  showDataOnHover?: boolean;
  backboneSet: BackboneSet;
}

const props = defineProps<Props>();

const backbone = computed(() => {
  return props.backboneSet.backbone;
});

const datatrackSets = computed(() => {
  return (props.backboneSet.datatrackSets);
});

const isDetailed = computed(() => {
  return props.backboneSet.backbone.renderType === 'detailed';
});

//Converts each property in this object to its own reactive prop
toRefs(props);
const selectedRegion = ref(store.state.selectedBackboneRegion ?? new BackboneSelection(new SelectedRegion(0,0,0,0), store.state.chromosome));
const basePairPositionLabel = ref<string>('');

watch(() => store.state.selectedBackboneRegion, (newVal: BackboneSelection, oldVal: BackboneSelection) => {
  // Watch for possible clear out of the selected backbone region
  if (!isDetailed.value && newVal == null)
  {
    selectedRegion.value = new BackboneSelection(new SelectedRegion(0,0,0,0), store.state.chromosome);
  }
  else if (!isDetailed.value && newVal != null)
  {
    selectedRegion.value = newVal;
  }
}, { deep: true });

watch(() => store.state.selectedGeneIds, () => {
  highlightSelections(store.state.selectedGeneIds);
});

onMounted(() => {
  highlightSelections(store.state.selectedGeneIds);
});

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

const onClick = (event: any, section: GeneDatatrack) => {
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

  let newSelectedData: SelectedData[] = [];
  if (section.gene) {
    const newData = getNewSelectedData(store, section.gene);
    const geneAndOrthologs = newData.selectedData;
    const newGeneIds = newData.rgdIds;
    newSelectedData.push(...geneAndOrthologs);
    geneIds.push(...newGeneIds);
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
  datatrackSets.value.forEach((set) => {
    if (set.datatracks[0].type === 'gene')
    {
      set.datatracks.forEach((section) => {
        if (section.gene == null)
        {
          return;
        }

        if (selectedGeneIds.includes(section.gene.rgdId)) 
        {
          section.isSelected = true;
        } 
        else 
        {
          section.isSelected = false;
        }
      });
    }
  });
};

const updatePositionLabel = (event: any) => {
  const basePairPos = getBasePairPositionFromSVG(event, backbone.value.windowSVGStart, backbone.value.windowSVGStop, backbone.value.windowStart, backbone.value.windowStop);
  basePairPositionLabel.value = Formatter.convertBasePairToLabel(basePairPos) || '';
};
</script>

<style lang="scss" scoped>
.label.small
{
  font: normal 8px sans-serif;
  pointer-events: none;
}

.chromosome-label
{
  font: normal 12px sans-serif;
  fill: #4c4b4b;
  pointer-events: none;
}

.section
{
  stroke-width: 0;
  &.gap
  {
    stroke-width: 1;
    stroke: black;
  }
  &.clickable
  {
    cursor: pointer;
  }
}

.selected-region
{
  stroke-width: 1;
}

.position-label
{
  stroke: black;
  pointer-events: none;
}
</style>
