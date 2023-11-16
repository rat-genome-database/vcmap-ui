<template>
  <template v-if="showStartStop && region.gaplessBlock.startLabel.isVisible">
    <OverviewSyntenyLabelsSVG :gapless-block="region.gaplessBlock"/>
  </template>
  <GapSVG v-for="(gapSection,index) in level1Gaps" :key="index" :gap-section="gapSection" />
  <GapSVG v-for="(gapSection,index) in level2Gaps" :key="index" :gap-section="gapSection" />
  <template v-for="(blockSection, index) in level1Blocks" :key="index">
    <rect v-if="blockSection.isHovered"
      :y="region.gaplessBlock.posY1"
      :x="region.gaplessBlock.posX1"
      :width="region.gaplessBlock.width"
      :height="region.gaplessBlock.height"
      fill="none"
      stroke-width=".5"
      stroke="#0000FF"
      stroke-dasharray="2,2"
    />
    <rect
      class="block-section"
      @mouseenter="onMouseEnter(blockSection, 'trackSection')"
      @mouseleave="onMouseLeave(blockSection)"
      @mousemove="updatePositionLabelFromMouseEvent($event, blockSection)"
      @click="selectOnClick ? onSyntenyBlockClick(blockSection) : () => {}"
      :y="blockSection.posY1"
      :x="blockSection.posX1"
      :width="blockSection.width"
      :height="blockSection.height"
      :fill="getSectionFill(blockSection)"
      :fill-opacity="1"
    />

    <ChromosomeLabelSVG v-if="showChromosome" :synteny-section="blockSection" />
  </template>

  <template v-for="(blockSection, index) in level2Blocks" :key="index">
    <rect v-if="blockSection.isHovered"
      :y="region.gaplessBlock.posY1"
      :x="region.gaplessBlock.posX1"
      :width="region.gaplessBlock.width"
      :height="region.gaplessBlock.height"
      fill="none"
      stroke-width=".5"
      stroke="#0000FF"
      stroke-dasharray="2,2"
    />
    <rect
      class="level-2 block-section"
      @mouseenter="onMouseEnter(blockSection, 'trackSection')"
      @mouseleave="onMouseLeave(blockSection)"
      @mousemove="updatePositionLabelFromMouseEvent($event, blockSection)"
      :y="blockSection.posY1"
      :x="blockSection.posX1"
      :width="blockSection.width"
      :height="blockSection.height"
      :fill="getSectionFill(blockSection)"
      :fill-opacity="1"
    />
    <ChromosomeLabelSVG v-if="showChromosome" :synteny-section="blockSection" />
  </template>

  <template v-if="region && showSyntenyOnHover">
    <SyntenyLinesSVG v-for="(blockSection, index) in region.syntenyBlocks" :key="index" :synteny-section="blockSection" />
  </template>

  <!-- Detailed Panel Synteny Postion Labels -->
  <template v-if="!showStartStop && region.gaplessBlock.startLabel.isVisible && region.gaplessBlock.height > 10 && region.syntenyBlocks.some((section) => section.isHovered)">
    <template v-if="region.gaplessBlock.posY1 < PANEL_SVG_START && region.gaplessBlock.posY2 > PANEL_SVG_START">
      <text
        class="label small"
        :x="region.gaplessBlock.posX1 - SYNTENY_LABEL_SHIFT"
        :y="PANEL_SVG_START + 10"
      >
        {{ calculateSectionStartPositionLabel(region.gaplessBlock) }}
      </text>
    </template>
    <template v-else>
      <text
        class="label small"
        dominant-baseline="hanging"
        :x="region.gaplessBlock.posX1 - SYNTENY_LABEL_SHIFT"
        :y="region.gaplessBlock.posY1"
      >
        {{region.gaplessBlock.startLabel.text}}
      </text>
    </template>
    <template v-if="region.gaplessBlock.posY2 > PANEL_SVG_STOP && region.gaplessBlock.posY1 < PANEL_SVG_STOP">
      <text
        class="label small"
        :x="region.gaplessBlock.posX1 - SYNTENY_LABEL_SHIFT"
        :y="PANEL_SVG_STOP - 10"
      >
        {{ calculateSectionStopPositionLabel(region.gaplessBlock) }}
      </text>
    </template>
    <template v-else>
      <text
        class="label small"
        dominant-baseline="auto"
        :x="region.gaplessBlock.posX1 - SYNTENY_LABEL_SHIFT"
        :y="region.gaplessBlock.posY2"
      >
        {{region.gaplessBlock.stopLabel.text}}
      </text>
    </template>
  </template>
  <template v-if="showBasePairLine">
    <text
      class="label small"
      text-anchor="end"
      dominant-baseline="middle"
      :x="region.gaplessBlock.posX1 - 1"
      :y="mouseYPos"
    >
      {{ basePairPositionLabel }}
    </text>
    <text
      class="label small"
      text-anchor="end"
      dominant-baseline="middle"
      :x="region.gaplessBlock.posX1 - 10"
      :y="mouseYPos ? mouseYPos - 10 : mouseYPos"
    >
      Chr: {{ region.gaplessBlock.chromosome }}
    </text>
    <line
      class="position-label"
      :x1="region.gaplessBlock.posX1"
      :x2="region.gaplessBlock.posX1 + region.gaplessBlock.width"
      :y1="mouseYPos"
      :y2="mouseYPos"
    />
  </template>


  <!-- Genes -->
  <template v-for="(datatrackSet, index) in datatrackSets" :key="index">
    <template v-for="(datatrack, index) in datatrackSet.datatracks" :key="index">
      <rect
        :class="getDatatrackClass(datatrackSet)"
        @mouseenter="onMouseEnter(datatrack, 'Gene')"
        @mouseleave="onMouseLeave(datatrack)"
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
</template>


<script lang="ts" setup>
import { watch, onMounted, ref } from 'vue';
import SelectedData, { SelectedDataType } from '@/models/SelectedData';
import SyntenyRegion from '@/models/SyntenyRegion';
import SyntenySection from '@/models/SyntenySection';
import DatatrackSection, { GeneDatatrack } from '@/models/DatatrackSection';
import { computed, toRefs } from '@vue/reactivity';
import { useStore } from 'vuex';
import { key } from '@/store';
import { Formatter } from '@/utils/Formatter';
import { VCMapSVGElement } from '@/models/VCMapSVGElement';
import ChromosomeLabelSVG from './ChromosomeLabelSVG.vue';
import SyntenyLinesSVG from './SyntenyLinesSVG.vue';
import GapSVG from './GapSVG.vue';
import BackboneSelection from '@/models/BackboneSelection';
import OverviewSyntenyLabelsSVG from './OverviewSyntenyLabelsSVG.vue';
import { PANEL_SVG_START, PANEL_SVG_STOP } from '@/utils/SVGConstants';
import useMouseBasePairPos from '@/composables/useMouseBasePairPos';
import GenomicSection from '@/models/GenomicSection';
import Gene from '@/models/Gene';
import DatatrackSet from '@/models/DatatrackSet';
import { getSelectedDataAndGeneIdsFromOrthologLine } from '@/utils/OrthologHandler';
import useSyntenyAndDataInteraction from '@/composables/useSyntenyAndDataInteraction';

const HOVER_HIGHLIGHT_COLOR = '#FF7C60';
const SELECTED_HIGHLIGHT_COLOR = '#FF4822';
const SYNTENY_LABEL_SHIFT = 10;

const store = useStore(key);

const { getBasePairPositionFromMouseEvent, getBasePairPositionFromSVG, mouseYPos } = useMouseBasePairPos();
const { setHoverOnGeneLinesAndDatatrackSections, onDatatrackSectionClick, changeHoverElementSize } = useSyntenyAndDataInteraction(store);

interface Props
{
  showSyntenyOnHover?: boolean;
  showStartStop?: boolean;
  showChromosome?: boolean;
  selectOnClick?: boolean;
  region: SyntenyRegion;
  syntenyHoverSvgY?: number | null;
  geneList: Map<number, Gene>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'synteny-hover', svgY: number | null): void
}>();

//Converts each property in this object to its own reactive prop
toRefs(props);
const basePairPositionLabel = ref<string>('');

onMounted(() => {
  highlightSelections(store.state.selectedGeneIds);
});

watch([() => store.state.selectedGeneIds, () => props.region], () => {
  highlightSelections(store.state.selectedGeneIds);
});

watch(() => props.syntenyHoverSvgY, () => {
  // If backbone is not being hovered but another synteny section is emitting a mouse event,
  // show the bp position on this backbone section
  if (!isRegionHovered.value && props.syntenyHoverSvgY != null)
  {
    updatePositionLabelFromSVG(props.syntenyHoverSvgY);
  }
});

const level1Blocks = computed(() => {
  return props.region.syntenyBlocks.filter(b => b.chainLevel === 1);
});
const level2Blocks = computed(() => {
  return props.region.syntenyBlocks.filter(b => b.chainLevel === 2);
});
const level1Gaps = computed(() => {
  return props.region.syntenyGaps.filter(g => g.chainLevel === 1);
});
const level2Gaps = computed(() => {
  return props.region.syntenyGaps.filter(g => g.chainLevel === 2);
});
const datatrackSets = computed(() => {
  return (props.region.datatrackSets);
});
const isRegionHovered = computed(() => {
  return props.region.syntenyBlocks.some(b => b.isHovered);
});

const showBasePairLine = computed(() => {
  return props.syntenyHoverSvgY != null && mouseYPos.value != null && !props.showStartStop
    && (isRegionHovered.value || basePairPositionLabel.value !== '');
});

const onMouseEnter = (section: SyntenySection | DatatrackSection, type: SelectedDataType) => {

  section.isHovered = true;

  // NOTE: ignore qtl datatracks for now
  if (section.type === 'qtl') return;

  const genesAreSelected = store.state.selectedGeneIds.length > 0;
  let selectedDataList: SelectedData[] = [];
  if (section.type === 'gene')
  {
    //
    // Gene datatrack section
    const geneSection = section as GeneDatatrack;
    setHoverOnGeneLinesAndDatatrackSections(geneSection?.lines, true);
    changeHoverElementSize(geneSection, true);

    // Only update the selected data panel if no Genes are already selected
    if (!genesAreSelected)
    {
      if (geneSection.lines.length > 0) {
        const {
          selectedData: selectedOrthologs,
        } = getSelectedDataAndGeneIdsFromOrthologLine(geneSection.lines[0]);
        selectedDataList.push(...selectedOrthologs);
      }
      else {
        selectedDataList.push(new SelectedData(geneSection.gene.clone(), 'Gene'));
      }
    }
  }
  else
  {
    //
    // Synteny section
    changeHoverElementSize(section, true);
    if (!genesAreSelected)
    {
      if (section.type === 'variant')
      {
        selectedDataList.push(new SelectedData(section, 'variantDensity'));
      } else
      {
        selectedDataList.push(new SelectedData(section, type));
      }
    }
  }

  if (selectedDataList.length > 0)
  {
    store.dispatch('setSelectedData', selectedDataList);
  }
};

const onMouseLeave = (section: DatatrackSection | SyntenySection) => {
  emit('synteny-hover', null);
  basePairPositionLabel.value = '';

  if (section)
  {
    section.isHovered = false;
  }
  
  // Only reset data onMouseLeave if there isn't a selected gene
  if (store.state.selectedGeneIds.length === 0) {
    store.dispatch('setSelectedData', null);
  }

  if (section.type === 'gene')
  {
    const geneSection = section as GeneDatatrack;
    setHoverOnGeneLinesAndDatatrackSections(geneSection.lines, false);
  }
  changeHoverElementSize(section, false);
};

const onSyntenyBlockClick = (section: GenomicSection) => {
  const selectedBackboneRegion = store.state.selectedBackboneRegion as BackboneSelection;
  const backboneChromosome = store.state.chromosome;
  if (backboneChromosome && section.backboneAlignment)
  {
    const basePairStart = section.backboneAlignment.start;
    const basePairStop = section.backboneAlignment.stop;
    selectedBackboneRegion.setViewportSelection(basePairStart, basePairStop);
    store.dispatch('setDetailedBasePairRequest', { start: basePairStart, stop: basePairStop });
  }
};

const getSectionFill = (section: VCMapSVGElement) => {
  if (section.isSelected) {return SELECTED_HIGHLIGHT_COLOR;}
  if (section.isHovered) {return HOVER_HIGHLIGHT_COLOR;}
  return section.elementColor;
};

const getDatatrackClass = (datatrackSet: DatatrackSet) => {
  if (datatrackSet.type === 'variant')
  {
    return 'block-section variant';
  }
  else
  {
    return 'block-section';
  }
};

const highlightSelections = (selectedGeneIds: number[]) => {
  // Look through the sections and highlight based on selected genes
  datatrackSets.value.forEach((set) => {
    if (set.datatracks && set.datatracks.length > 0 && set.datatracks[0].type === 'gene')
    {
      // TODO: Feels a bit fragile to tell the type-checker to treat this as GeneDatatrack[]. Maybe there
      // is a better way to organize our different types of DatatrackSection models to allow Typescript to
      // "know" that this is a GeneDatatrack[] type. We should be aware that "as" will not throw an error if
      // set.datatracks is not of type GeneDatatrack[].
      (set.datatracks as GeneDatatrack[]).forEach(section => {
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
  // Highlight the line if needed, and make sure genes highlighted too
  // (this ensures backbone and comparitive genes are highlighted, regardless of which is clicked)
  props.region.orthologLines.forEach((line) => {
    if (selectedGeneIds.includes(line.backboneGene.rgdId || -1) ||
        selectedGeneIds.includes(line.offBackboneGene.rgdId || -1)) 
    {
      line.isSelected = true;
      if (line.backboneGeneDatatrack) line.backboneGeneDatatrack.isSelected = true;
      if (line.offBackboneGeneDatatrack) line.offBackboneGeneDatatrack.isSelected = true;
    } 
    else 
    {
      line.isSelected = false;
    }
  });
};

const calculateSectionStartPositionLabel = (section: SyntenySection) => {
  const hiddenHeight = PANEL_SVG_START - section.posY1;
  const basePairPerSVG = section.length / section.height;
  // Subtract or multiple the number of hidden basepairs above the visible window based on inversion
  const labelBasePair = section.isInverted ? section.speciesStart - (hiddenHeight * basePairPerSVG) : section.speciesStart + (hiddenHeight * basePairPerSVG);
  return Formatter.convertBasePairToLabel(Math.round(labelBasePair));
};

const calculateSectionStopPositionLabel = (section: SyntenySection) => {
  const hiddenHeight = section.posY2 - PANEL_SVG_STOP;
  const basePairPerSVG = section.length / section.height;
  // Subtract or multiple the number of hidden basepairs below the visible window based on inversion
  const labelBasePair = !section.isInverted ? section.speciesStop - (hiddenHeight * basePairPerSVG) : section.speciesStop + (hiddenHeight * basePairPerSVG);
  return Formatter.convertBasePairToLabel(Math.round(labelBasePair));
};

const updatePositionLabelFromMouseEvent = (event: MouseEvent, blockSection: SyntenySection) => {
  const basePairPos = getBasePairPositionFromMouseEvent(event, blockSection.posY1, blockSection.posY2, blockSection.speciesStart, blockSection.speciesStop);
  basePairPositionLabel.value = Formatter.convertBasePairToLabel(basePairPos) || '';

  if (isRegionHovered.value)
  {
    // Emit our svg y position so that other synteny sections can see it
    emit('synteny-hover', mouseYPos.value ?? null);
  }
};

const getBlockFromSVGPosition = (svgY: number) => {
  // First check the gapless block to see if we even need to loop through the synteny blocks
  if (props.region.gaplessBlock.posY1 <= svgY && props.region.gaplessBlock.posY2 >= svgY)
  {
    // Loop through its synteny blocks to identify which block is at this svg position
    for (let i = 0; i < props.region.syntenyBlocks.length; i++)
    {
      const block = props.region.syntenyBlocks[i];
      if (block.posY1 <= svgY && block.posY2 >= svgY)
      {
        return block;
      }
    }
  }

  return null;
};

const updatePositionLabelFromSVG = (svgY: number) => {
  const blockSection = getBlockFromSVGPosition(svgY);
  if (blockSection != null)
  {
    const basePairPos = getBasePairPositionFromSVG(svgY, blockSection.posY1, blockSection.posY2, blockSection.speciesStart, blockSection.speciesStop);
    basePairPositionLabel.value = Formatter.convertBasePairToLabel(basePairPos) || '';
  }
  else
  {
    basePairPositionLabel.value = '';
  }
};
</script>

<style lang="scss" scoped>
.label.small
{
  font: normal 8px sans-serif;

  &:hover
  {
    cursor: pointer;
  }
  pointer-events: none;
}

.level-2
{
  filter: brightness(60%);
}

.block-section
{
  stroke-width: 0;
  &.variant
  {
    stroke-width: 0.25;
  }
}
.block-section:hover
{
  cursor: pointer;
}

.position-label
{
  stroke: black;
  pointer-events: none;
}
</style>