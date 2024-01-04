<template>
  <!-- BackboneSection SVG -->
  <rect v-if="backbone" data-test="track-section-svg" class="section"
    @mouseenter="onMouseEnter($event, backbone, 'backbone')" @mouseleave="() => onMouseLeave(backbone)"
    @mousemove="updatePositionLabelFromMouseEvent($event)"
    :fill="backbone.isHovered && showDataOnHover ? HOVER_HIGHLIGHT_COLOR : backbone.elementColor" :x="backbone.posX1"
    :y="backbone.posY1" :width="backbone.width" :height="backbone.height" />

  <!-- Chromosome Label -->
  <text v-if="backbone" class="chromosome-label" :x="backbone.posX1 + (SVGConstants.trackWidth / 2)"
    :y="backbone.windowSVGMiddle" dominant-baseline="middle" text-anchor="middle">
    {{ backbone.chromosome }}
  </text>

  <!-- BP labels -->
  <template v-for="(label, index) in backbone.labels" :key="index">
    <text v-if="label.isVisible" data-test="bp-label" class="label small" :x="label.posX" :y="label.posY">
      {{ label.text }}
    </text>
  </template>

  <!-- TODO: This will likely be its own component soon to handle different datatrack types -->
  <!-- Datatracks -->
  <template v-for="(datatrackSet, index) in datatrackSets" :key="index">
    <template v-for="(datatrack, index) in datatrackSet.datatracks" :key="index">
      <g @contextmenu.prevent="showContextMenu($event, datatrack)">
        <rect :class="getSectionClass(datatrackSet)" @mouseenter="onMouseEnter($event, datatrack, 'Gene')"
          @mouseleave="() => onMouseLeave(datatrack)" @click="onDatatrackSectionClick($event, datatrack, geneList)"
          :y="datatrack.posY1" :x="datatrack.posX1" :width="datatrack.width" :height="datatrack.height"
          :fill="getSectionFill(datatrack)" :fill-opacity="datatrack.opacity" :stroke="getSectionFill(datatrack)" />
      </g>
    </template>
  </template>

  <!-- Visible selection that changes depending on Detailed panel zoom -->
  <template
    v-if="!isDetailed && selectedRegion?.viewportSelection != null && selectedRegion.viewportSelection.svgHeight > 0">
    <rect stroke="green" fill="green" fill-opacity="0.5" :x="backbone.posX1 - 2"
      :y="selectedRegion.viewportSelection.svgYPoint" :width="SVGConstants.trackWidth + INNER_SELECTION_EXTRA_WIDTH"
      :height="selectedRegion.viewportSelection.svgHeight" />

    <text v-if="selectedRegion.viewportSelection.svgYPoint > backbone.posY1 + 10" class="label small"
      :x="backbone.posX1 - 5" :y="selectedRegion.viewportSelection.svgYPoint - 2">
      {{ Formatter.convertBasePairToLabel(selectedRegion.viewportSelection.basePairStart) }}
    </text>

    <text
      v-if="selectedRegion.viewportSelection.svgYPoint + selectedRegion.viewportSelection.svgHeight < backbone.posY2 - 10"
      class="label small" :x="backbone.posX1 - 5"
      :y="selectedRegion.viewportSelection.svgYPoint + selectedRegion.viewportSelection.svgHeight + 7">
      {{ Formatter.convertBasePairToLabel(selectedRegion.viewportSelection.basePairStop) }}
    </text>
  </template>

  <template v-if="showBasePairLine">
    <text class="label small" text-anchor="end" dominant-baseline="middle" :x="backbone.posX1 - 1" :y="mouseYPos">
      {{ basePairPositionLabel }}
    </text>
    <line class="position-label" :x1="backbone.posX1" :x2="backbone.posX1 + backbone.width" :y1="mouseYPos"
      :y2="mouseYPos" />
  </template>
  <template v-if="props.syntenyHoverBackboneYValues != null">
    <text class="block-label-text" text-anchor="end" dominant-baseline="middle" :x="backbone.posX1 - 1"
      :y="props.syntenyHoverBackboneYValues![0]">
      {{ blockStartPositionLabel }}
    </text>
    <line class="block-label" :x1="backbone.posX1" :x2="backbone.posX1 + backbone.width"
      :y1="props.syntenyHoverBackboneYValues![0]" :y2="props.syntenyHoverBackboneYValues![0]" stroke-dasharray="2,2" />
    <text class="block-label-text" text-anchor="end" dominant-baseline="middle" :x="backbone.posX1 - 1"
      :y="props.syntenyHoverBackboneYValues![1]">
      {{ blockStopPositionLabel }}
    </text>
    <line class="block-label" :x1="backbone.posX1" :x2="backbone.posX1 + backbone.width"
      :y1="props.syntenyHoverBackboneYValues![1]" :y2="props.syntenyHoverBackboneYValues![1]" stroke-dasharray="2,2" />
  </template>
</template>

<script lang="ts" setup>
import BackboneSelection from '@/models/BackboneSelection';
import SelectedData, { SelectedDataType } from '@/models/SelectedData';
import { computed, toRefs } from '@vue/reactivity';
import { ref, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import SVGConstants from '@/utils/SVGConstants';
import { key } from '@/store';
import { Formatter } from '@/utils/Formatter';
import BackboneSection from '@/models/BackboneSection';
import BackboneSet from '@/models/BackboneSet';
import Gene from '@/models/Gene';
import DatatrackSection, { GeneDatatrack, VariantDensity } from '@/models/DatatrackSection';
import DatatrackSet from '@/models/DatatrackSet';
import { VCMapSVGElement } from '@/models/VCMapSVGElement';
import useMouseBasePairPos from '@/composables/useMouseBasePairPos';
import { getSelectedDataAndGeneIdsFromOrthologLine } from '@/utils/OrthologHandler';
import useSyntenyAndDataInteraction from '@/composables/useSyntenyAndDataInteraction';
import { createUrl } from '@/utils/ExternalLinks';

const INNER_SELECTION_EXTRA_WIDTH = 4;
const HOVER_HIGHLIGHT_COLOR = '#FF7C60';
const SELECTED_HIGHLIGHT_COLOR = '#FF4822';

const store = useStore(key);

const { getBasePairPositionFromMouseEvent, getBasePairPositionFromSVG, mouseYPos, } = useMouseBasePairPos();
const {
  setHoverOnGeneLinesAndDatatrackSections,
  onDatatrackSectionClick,
  changeHoverElementSize,
  showHoveredData,
  hideHoveredData,
} = useSyntenyAndDataInteraction(store);

interface Props {
  showDataOnHover?: boolean;
  backboneSet: BackboneSet;
  syntenyHoverSvgY?: number | null;
  geneList: Map<number, Gene>;
  syntenyHoverBackboneYValues?: number[] | null;
}

interface MenuItem {
  label: string,
  command: () => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'synteny-hover', svgY: number | null): void,
  (e: 'show-context-menu', event: MouseEvent, items: MenuItem[]): void
}>();

const backbone = computed(() => {
  return props.backboneSet.backbone;
});

const datatrackSets = computed(() => {
  return (props.backboneSet.datatrackSets);
});

const isDetailed = computed(() => {
  return props.backboneSet.backbone.renderType === 'detailed';
});

const showBasePairLine = computed(() => {
  return props.syntenyHoverSvgY != null && mouseYPos.value != null && isDetailed.value;
});

//Converts each property in this object to its own reactive prop
toRefs(props);
let selectedRegion = ref<BackboneSelection>();
if (store.state.chromosome) {
  selectedRegion.value = store.state.selectedBackboneRegion ?? new BackboneSelection(store.state.chromosome);
}
const basePairPositionLabel = ref<string>('');
const blockStartPositionLabel = ref<string>('');
const blockStopPositionLabel = ref<string>('');

watch(() => store.state.selectedBackboneRegion, (newVal: BackboneSelection | null) => {
  // Watch for possible clear out of the selected backbone region
  if (!isDetailed.value && newVal == null && store.state.chromosome != null) {
    selectedRegion.value = new BackboneSelection(store.state.chromosome);
  }
  else if (!isDetailed.value && newVal != null) {
    selectedRegion.value = newVal;
  }
}, { deep: true });

watch([() => store.state.selectedGeneIds, () => props.backboneSet, () => store.state.selectedVariantSections], () => {
  highlightSelections(store.state.selectedGeneIds);
});

watch(() => props.syntenyHoverSvgY, () => {
  // If backbone is not being hovered but another synteny section is emitting a mouse event,
  // show the bp position on this backbone section
  if (!props.backboneSet.backbone.isHovered && props.syntenyHoverSvgY != null) {
    updatePositionLabelFromSVG(props.syntenyHoverSvgY, props.syntenyHoverBackboneYValues![0], props.syntenyHoverBackboneYValues![1]);
  }
});

onMounted(() => {
  highlightSelections(store.state.selectedGeneIds);
});

const findMapKey = (name: string) => {
  for (const species of store.state.comparativeSpecies) {
    if (name === species.name) return species.activeMap.key;
  }
  return store.state.species?.activeMap.key;
};

const showContextMenu = (event: MouseEvent, datatrack: DatatrackSection) => {
  let items: MenuItem[] = [];
  items = [
    {
      // Change label depending on if variant or gene
      label: datatrack.type === 'variant' ? 'Link to Variant Visualizer' : 'Link to JBrowse',
      command: () => { window.open(createUrl(datatrack, findMapKey(datatrack.speciesName))); },
      icon: 'pi pi-external-link'
    }
  ];
  emit('show-context-menu', event, items);
};

const onMouseEnter = (event: MouseEvent, section: BackboneSection | DatatrackSection, type: SelectedDataType) => {

  if (section) {
    section.isHovered = true;
  }

  // NOTE: disable selected data for qtls for now
  if (section.type === 'qtl') {
    return;
  }

  showHoveredData(section, event);
  if (section.type === 'gene') {
    changeHoverElementSize(section, true);
  }

  // Only set selected data if there are no selected genes
  if (store.state.selectedGeneIds.length === 0 && section.type === 'gene' && store.state.selectedVariantSections.length === 0 && store.state.selectedBlocks.length === 0) {
    const selectedDataList: SelectedData[] = [];
    const geneSection = section as GeneDatatrack;
    setHoverOnGeneLinesAndDatatrackSections(geneSection?.lines, true);

    if (geneSection.lines.length > 0) {
      const {
        selectedData: selectedOrthologs,
      } = getSelectedDataAndGeneIdsFromOrthologLine(geneSection.lines[0]);
      selectedDataList.push(...selectedOrthologs);
    }
    else {
      selectedDataList.push(new SelectedData(geneSection.gene.clone(), 'Gene'));
    }

    store.dispatch('setSelectedData', selectedDataList);
  }
  else if (store.state.selectedGeneIds.length === 0 && store.state.selectedVariantSections.length === 0 && store.state.selectedBlocks.length === 0 ) {
    if (section.type === 'variant') {
      const selectedData = new SelectedData(section, 'variantDensity');
      store.dispatch('setSelectedData', [selectedData]);
    }
  }
};

const onMouseLeave = (section: BackboneSection | DatatrackSection) => {
  emit('synteny-hover', null);

  if (section && section.isHovered == true) {
    section.isHovered = false;
  }
  hideHoveredData();

  // NOTE: disable selected data for qtls
  if (section.type === 'qtl') {
    return;
  }

  if (section.type === 'gene') {
    const geneSection = section as GeneDatatrack;
    setHoverOnGeneLinesAndDatatrackSections(geneSection?.lines, false);
    changeHoverElementSize(geneSection, false);
  }
};

const getSectionFill = (section: VCMapSVGElement) => {
  if (section.isSelected) { return SELECTED_HIGHLIGHT_COLOR; }
  if (section.isHovered) { return HOVER_HIGHLIGHT_COLOR; }
  return section.elementColor;
};

const getSectionClass = (datatrackSet: DatatrackSet) => {
  if (datatrackSet.type === 'variant') {
    return 'section clickable variant';
  }
  else {
    return 'section clickable';
  }
};

const highlightSelections = (selectedGeneIds: number[]) => {
  const geneDatatracks = datatrackSets.value[props.backboneSet.geneDatatrackSetIndex]?.datatracks as GeneDatatrack[];
  const variantDatatracks = datatrackSets.value[props.backboneSet.variantDatatrackSetIndex]?.datatracks as VariantDensity[];

  if (!geneDatatracks) {
    return;
  }
  // Look through the backbone gene datatracks and highlight based on selected genes
  geneDatatracks
    .forEach(section => {
      if (section.gene == null) {
        return;
      }

      if (selectedGeneIds.includes(section.gene.rgdId)) {
        section.isSelected = true;
      }
      else {
        section.isSelected = false;
      }
    });

  // Look through the backbone variant datatracks and highlight based on selected variants
  if (!variantDatatracks) {
    return;
  }

  variantDatatracks
    .forEach(section => {
      if (store.state.selectedVariantSections.some((selectedSection: VariantDensity) => selectedSection.speciesStart === section.speciesStart)) {
        section.isSelected = true;
      } else {
        section.isSelected = false;
      }
    });
};

const updatePositionLabelFromMouseEvent = (event: MouseEvent) => {
  const basePairPos = getBasePairPositionFromMouseEvent(event, backbone.value.windowSVGStart, backbone.value.windowSVGStop, backbone.value.windowStart, backbone.value.windowStop);
  basePairPositionLabel.value = Formatter.convertBasePairToLabel(basePairPos) || '';

  if (props.backboneSet.backbone.isHovered) {
    // Emit our svg y position so that other synteny sections can see it
    emit('synteny-hover', mouseYPos.value ?? null);
  }
};

const updatePositionLabelFromSVG = (svgY: number, blockStartY: number, blockStopY: number) => {
  const basePairStart = getBasePairPositionFromSVG(blockStartY, backbone.value.windowSVGStart, backbone.value.windowSVGStop, backbone.value.windowStart, backbone.value.windowStop);
  const basePairStop = getBasePairPositionFromSVG(blockStopY, backbone.value.windowSVGStart, backbone.value.windowSVGStop, backbone.value.windowStart, backbone.value.windowStop);
  const basePairPos = getBasePairPositionFromSVG(svgY, backbone.value.windowSVGStart, backbone.value.windowSVGStop, backbone.value.windowStart, backbone.value.windowStop);

  // todo: calculate start and stop label positions from svgY's based on hovered synteny block start and stop
  blockStartPositionLabel.value = Formatter.convertBasePairToLabel(basePairStart) || '';
  blockStopPositionLabel.value = Formatter.convertBasePairToLabel(basePairStop) || '';
  basePairPositionLabel.value = Formatter.convertBasePairToLabel(basePairPos) || '';
};
</script>

<style lang="scss" scoped>
.label.small {
  font: normal 8px sans-serif;
  pointer-events: none;
}

.block-label-text {
  color: rgb(75, 74, 74);
  font: normal 8px sans-serif;
  pointer-events: none;
}

.chromosome-label {
  font: normal 12px sans-serif;
  fill: #4c4b4b;
  pointer-events: none;
}

.section {
  stroke-width: 0;

  &.gap {
    stroke-width: 1;
    stroke: black;
  }

  &.clickable {
    cursor: pointer;
  }

  &.variant {
    stroke-width: 0.25;
  }
}

.selected-region {
  stroke-width: 1;
}

.position-label {
  stroke: black;
  pointer-events: none;
}

.block-label {
  stroke: rgb(75, 74, 74);
  pointer-events: none;
}
</style>
