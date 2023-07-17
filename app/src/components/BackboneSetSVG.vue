<template>
  <!-- BackboneSection SVG -->
  <rect v-if="backbone"
    data-test="track-section-svg"
    class="section"
    @mouseenter="() => onMouseEnter(backbone, 'backbone')"
    @mouseleave="() => onMouseLeave(backbone)"
    @mousemove="updatePositionLabelFromMouseEvent($event)"
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
        :class="getSectionClass(datatrackSet)"
        @mouseenter="() => onMouseEnter(datatrack, 'Gene')"
        @mouseleave="() => onMouseLeave(datatrack)"
        @click="onDatatrackSectionClick($event, datatrack, geneList)"
        :y="datatrack.posY1"
        :x="datatrack.posX1"
        :width="datatrack.width"
        :height="datatrack.height"
        :fill="getSectionFill(datatrack)"
        :fill-opacity="datatrack.opacity"
        :stroke="getSectionFill(datatrack)"
      />
    </template>
  </template>

  <!-- Visible selection that changes depending on Detailed panel zoom -->
  <template v-if="!isDetailed && selectedRegion?.viewportSelection != null && selectedRegion.viewportSelection.svgHeight > 0">
    <rect
      stroke="green"
      fill="green"
      fill-opacity="0.5"
      :x="backbone.posX1 - 2" :y="selectedRegion.viewportSelection.svgYPoint"
      :width="SVGConstants.trackWidth + INNER_SELECTION_EXTRA_WIDTH"
      :height="selectedRegion.viewportSelection.svgHeight" />
    
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

  <template v-if="showBasePairLine">
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
import DatatrackSection, { GeneDatatrack } from '@/models/DatatrackSection';
import DatatrackSet from '@/models/DatatrackSet';
import { VCMapSVGElement } from '@/models/VCMapSVGElement';
import useMouseBasePairPos from '@/composables/useMouseBasePairPos';
import { getSelectedDataAndGeneIdsFromOrthologLine } from '@/utils/OrthologHandler';
import useSyntenyAndDataInteraction from '@/composables/useSyntenyAndDataInteraction';

const INNER_SELECTION_EXTRA_WIDTH = 4;
const HOVER_HIGHLIGHT_COLOR = '#FF7C60';
const SELECTED_HIGHLIGHT_COLOR = '#FF4822';

const store = useStore(key);

const { getBasePairPositionFromMouseEvent, getBasePairPositionFromSVG, mouseYPos, } = useMouseBasePairPos();
const { setHoverOnGeneLinesAndDatatrackSections, onDatatrackSectionClick } = useSyntenyAndDataInteraction(store);

interface Props
{
  showDataOnHover?: boolean;
  backboneSet: BackboneSet;
  syntenyHoverSvgY?: number | null;
  geneList: Map<number, Gene>;
  
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'synteny-hover', svgY: number | null): void
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
if (store.state.chromosome)
{
  selectedRegion.value = store.state.selectedBackboneRegion ?? new BackboneSelection(store.state.chromosome);
}
const basePairPositionLabel = ref<string>('');

watch(() => store.state.selectedBackboneRegion, (newVal: BackboneSelection | null) => {
  // Watch for possible clear out of the selected backbone region
  if (!isDetailed.value && newVal == null && store.state.chromosome != null)
  {
    selectedRegion.value = new BackboneSelection(store.state.chromosome);
  }
  else if (!isDetailed.value && newVal != null)
  {
    selectedRegion.value = newVal;
  }
}, { deep: true });

watch([() => store.state.selectedGeneIds, () => props.backboneSet], () => {
  highlightSelections(store.state.selectedGeneIds);
});

watch(() => props.syntenyHoverSvgY, () => {
  // If backbone is not being hovered but another synteny section is emitting a mouse event,
  // show the bp position on this backbone section
  if (!props.backboneSet.backbone.isHovered && props.syntenyHoverSvgY != null)
  {
    updatePositionLabelFromSVG(props.syntenyHoverSvgY);
  }
});

onMounted(() => {
  highlightSelections(store.state.selectedGeneIds);
});

const onMouseEnter = (section: BackboneSection | DatatrackSection, type: SelectedDataType) => {
  
  if (section)
  {
    section.isHovered = true;
  }

  // NOTE: disable selected data for qtls for now
  if (section.type === 'qtl')
  {
    return;
  }

  // Only set selected data if there are no selected genes
  if (store.state.selectedGeneIds.length === 0 && section.type === 'gene')
  {
    const selectedDataList: SelectedData[] = [];
    const geneSection = section as GeneDatatrack;
    setHoverOnGeneLinesAndDatatrackSections(geneSection?.lines, true);

    if (geneSection.lines.length > 0)
    {
      const {
        selectedData: selectedOrthologs,
      } = getSelectedDataAndGeneIdsFromOrthologLine(geneSection.lines[0]);
      selectedDataList.push(...selectedOrthologs);
    }
    else
    {
      selectedDataList.push(new SelectedData(geneSection.gene.clone(), 'Gene'));
    }

    store.dispatch('setSelectedData', selectedDataList);
  }
  else if (store.state.selectedGeneIds.length === 0)
  {
   
    if (section.type === 'variant')
    {
      const selectedData = new SelectedData(section, 'variantDensity');
      store.dispatch('setSelectedData', [selectedData]);
    }else
    if (section.type === 'epigenome')
    {
      const selectedData = new SelectedData(section, 'epigenomeDensity');
      store.dispatch('setSelectedData', [selectedData]);
    }
    else
    {
      // BackboneSection
      const selectedData = new SelectedData(section, type);
      store.dispatch('setSelectedData', [selectedData]);
    }
  }
};

const onMouseLeave = (section: BackboneSection | DatatrackSection) => {
  emit('synteny-hover', null);

  if (section && section.isHovered == true)
  {
    section.isHovered = false;
  }

  // NOTE: disable selected data for qtls and variants for now
  if (section.type === 'qtl' || section.type === 'variant' || section.type === 'epigenome')
  {
    return;
  }

  if (section.type === 'gene')
  {
    const geneSection = section as GeneDatatrack;
    setHoverOnGeneLinesAndDatatrackSections(geneSection?.lines, false);
  }

  // Only reset selected data if there are no selected genes
  if (store.state.selectedGeneIds.length === 0)
  {
    store.dispatch('setSelectedData', null);
  }
};

const getSectionFill = (section: VCMapSVGElement) => {
  if (section.isSelected) {return SELECTED_HIGHLIGHT_COLOR;}
  if (section.isHovered) {return HOVER_HIGHLIGHT_COLOR;}
  return section.elementColor;
};

const getSectionClass = (datatrackSet: DatatrackSet) => {
  console.log("DATA TRACK SET TYPE:"+ datatrackSet.type );
  if (datatrackSet.type === 'variant')
  {
    return 'section clickable variant';
  }
  if (datatrackSet.type === 'epigenome')
  {
    return 'section clickable epigenome';
  }
  else
  {
    return 'section clickable';
  }
};

const highlightSelections = (selectedGeneIds: number[]) => {
  // Look through the backbone gene datatracks and highlight based on selected genes
  (datatrackSets.value[props.backboneSet.geneDatatrackSetIndex]?.datatracks as GeneDatatrack[])
    .forEach(section => {
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
};

const updatePositionLabelFromMouseEvent = (event: MouseEvent) => {
  const basePairPos = getBasePairPositionFromMouseEvent(event, backbone.value.windowSVGStart, backbone.value.windowSVGStop, backbone.value.windowStart, backbone.value.windowStop);
  basePairPositionLabel.value = Formatter.convertBasePairToLabel(basePairPos) || '';

  if (props.backboneSet.backbone.isHovered)
  {
    // Emit our svg y position so that other synteny sections can see it
    emit('synteny-hover', mouseYPos.value ?? null);
  }
};

const updatePositionLabelFromSVG = (svgY: number) => {
  const basePairPos = getBasePairPositionFromSVG(svgY, backbone.value.windowSVGStart, backbone.value.windowSVGStop, backbone.value.windowStart, backbone.value.windowStop);
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

  &.variant
  {
    stroke-width: 0.25;
  }
  &.epigenome
  {
    stroke-width: 0.25;
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
