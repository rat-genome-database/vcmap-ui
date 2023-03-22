<template>
  <template v-if="showStartStop && region.gaplessBlock.startLabel.isVisible">
    <OverviewSyntenyLabelsSVG :gapless-block="region.gaplessBlock"/>
  </template>
  <GapSVG v-for="(gapSection,index) in level1Gaps" :key="index" :gap-section="gapSection" />
  <GapSVG v-for="(gapSection,index) in level2Gaps" :key="index" :gap-section="gapSection" />
  <template v-for="(blockSection, index) in level1Blocks" :key="index">
    <rect
      class="block-section"
      @mouseenter="onMouseEnter(blockSection, 'trackSection')"
      @mouseleave="onMouseLeave(blockSection, 'trackSection')"
      @mousemove="updatePositionLabel($event, blockSection)"
      @click="selectOnClick ? onSectionClick(blockSection) : () => {}"
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
    <rect
      class="level-2 block-section"
      @mouseenter="onMouseEnter(blockSection, 'trackSection')"
      @mouseleave="onMouseLeave(blockSection, 'trackSection')"
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
  <template v-if="mouseYPos && !showStartStop && region.syntenyBlocks.some((section) => section.isHovered)">
    <text
      class="label small"
      text-anchor="end"
      dominant-baseline="middle"
      :x="region.gaplessBlock.posX1 - 1"
      :y="mouseYPos"
    >
      {{ basePairPositionLabel }}
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
        class="block-section"
        @mouseenter="onMouseEnter(datatrack, 'Gene')"
        @mouseleave="onMouseLeave(datatrack, 'Gene')"
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
  
</template>


<script lang="ts" setup>
import { watch, onMounted, ref } from 'vue';
import SelectedData, { SelectedDataType } from '@/models/SelectedData';
import SyntenyRegion from '@/models/SyntenyRegion';
import SyntenySection from '@/models/SyntenySection';
import { GeneDatatrack } from '@/models/DatatrackSection';
import { computed, toRefs } from '@vue/reactivity';
import { useStore } from 'vuex';
import { key } from '@/store';
import { Formatter } from '@/utils/Formatter';
import { getNewSelectedData } from '@/utils/DataPanelHelpers';
import { VCMapSVGElement } from '@/models/VCMapSVGElement';
import ChromosomeLabelSVG from './ChromosomeLabelSVG.vue';
import SyntenyLinesSVG from './SyntenyLinesSVG.vue';
import GapSVG from './GapSVG.vue';
import BackboneSelection from '@/models/BackboneSelection';
import OverviewSyntenyLabelsSVG from './OverviewSyntenyLabelsSVG.vue';
import { PANEL_SVG_START, PANEL_SVG_STOP } from '@/utils/SVGConstants';
import useMouseBasePairPos from '@/composables/useMouseBasePairPos';
import GenomicSection from '@/models/GenomicSection';

const HOVER_HIGHLIGHT_COLOR = '#FF7C60';
const SELECTED_HIGHLIGHT_COLOR = '#FF4822';
const SYNTENY_LABEL_SHIFT = 10;

const store = useStore(key);

const { getBasePairPositionFromSVG, mouseYPos } = useMouseBasePairPos();

interface Props
{
  showSyntenyOnHover?: boolean;
  showStartStop?: boolean;
  showChromosome?: boolean;
  selectOnClick?: boolean;
  region: SyntenyRegion;
}
const props = defineProps<Props>();

//Converts each property in this object to its own reactive prop
toRefs(props);
const basePairPositionLabel = ref<string>('');

watch(() => store.state.selectedGeneIds, () => {
  highlightSelections(store.state.selectedGeneIds);
});

onMounted(() => {
  highlightSelections(store.state.selectedGeneIds);
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

const onMouseEnter = (section: SyntenySection | GeneDatatrack, type: SelectedDataType) => {
  // if ()
    section.isHovered = true;
    
    // Only update the selected data panel if no Genes are already selected
    if (store.state.selectedGeneIds.length === 0)
    {
      let selectedData;
      if (type === 'Gene')
      {
        const geneSection = section as GeneDatatrack;
        if (geneSection?.gene)
        {
          highlightGeneLines(geneSection?.gene.rgdId, 'enter');
        }
        selectedData = new SelectedData(geneSection.gene.clone(), 'Gene');
      }
      else
      {
        selectedData = new SelectedData(section, type);
      }
      store.dispatch('setSelectedData', [selectedData]);
    }


};

const onMouseLeave = (section: VCMapSVGElement, type: SelectedDataType) => {
  if (section)
  {
    section.isHovered = false;
  }
  
  // Only reset data onMouseLeave if there isn't a selected gene
  if (store.state.selectedGeneIds.length === 0) {
    store.dispatch('setSelectedData', null);
  }

  if (type === 'Gene') 
  {
    const geneSection = section as GeneDatatrack;
    if (geneSection?.gene)
    {
      highlightGeneLines(geneSection.gene.rgdId, 'exit');
    }
  }
};

const onSectionClick = (section: GenomicSection) => {
  const selectedBackboneRegion = store.state.selectedBackboneRegion as BackboneSelection;
  const backboneChromosome = store.state.chromosome;
  if (backboneChromosome && section.backboneAlignment)
  {
    const basePairStart = section.backboneAlignment.start;
    const basePairStop = section.backboneAlignment.stop;
    selectedBackboneRegion.setViewportSelection(basePairStart, basePairStop);
    store.dispatch('setDetailedBasePairRequest', { start: basePairStart, stop: basePairStop });
    // store.dispatch('setDetailedBasePairRange', { start: basePairStart, stop: basePairStop });
  }
};

const getSectionFill = (section: VCMapSVGElement) => {
  if (section.isSelected) {return SELECTED_HIGHLIGHT_COLOR;}
  if (section.isHovered) {return HOVER_HIGHLIGHT_COLOR;}
  return section.elementColor;
};

const highlightSelections = (selectedGeneIds: number[]) => {
  // Look through the sections and highlight based on selected genes
  datatrackSets.value.forEach((set) => {
    if (set.datatracks && set.datatracks.length > 0 && set.datatracks[0].type === 'gene')
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
  // Highlight the line if needed, and make sure genes highlighted too
  // (this ensures backbone and comparitive genes are highlighted, regardless of which is clicked)
  props.region.orthologLines.forEach((line) => {
    if (selectedGeneIds.includes(line.backboneGene.gene?.rgdId || -1) ||
        selectedGeneIds.includes(line.comparativeGene.gene?.rgdId || -1)) 
    {
      line.isSelected = true;
      line.backboneGene.isSelected = true;
      line.comparativeGene.isSelected = true;
    } 
    else 
    {
      line.isSelected = false;
    }
  });
};

const onClick = (event: any, section: GeneDatatrack) => {
  if (!section.gene?.rgdId) return;

  // If clicked section already selected, just reset the selectedGeneId state
  if (store.state.selectedGeneIds.includes(section.gene?.rgdId || -1))
  {
    store.dispatch('setSelectedGeneIds', []);
    store.dispatch('setSelectedData', null);
    return;
  }

  // TODO: This behavior needs to be mimicked in the GeneLabels as well:
  // If shift key is held, we'll just add to the selections, otherwise, reset first
  let geneIds: number[] = event.shiftKey ? [...store.state.selectedGeneIds] : [];

  let newSelectedData: SelectedData[] = [];
  if (section.gene)
  {
    // FIXME: Orthologs
    // FIXME: This code isn't used on the Backbone! Need to correct that inconsistency...
    newSelectedData.push(new SelectedData(section.gene.clone(), 'Gene'));
    geneIds.push(section.gene?.rgdId);
  }

  store.dispatch('setSelectedGeneIds', geneIds || []);
  if (event.shiftKey)
  {
    const selectedDataArray = [...(store.state.selectedData || []), ...newSelectedData];
    store.dispatch('setSelectedData', selectedDataArray);
  }
  else
  {
    store.dispatch('setSelectedData', newSelectedData);
  }
};

const highlightGeneLines = (sectionId: number, type: string) => {
  const dataPanelSelected = store.state.selectedGeneIds.includes(sectionId);
  props.region.orthologLines.forEach((line) => {
    if (line.comparativeGene.gene?.rgdId == sectionId ||
        line.backboneGene.gene?.rgdId == sectionId)
    {
      if (type == 'enter')
      {
        line.isSelected = true;
      }
      else if (type == 'exit' && !dataPanelSelected)
      {
        line.isSelected = false;
      }
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

const updatePositionLabel = (event: any, blockSection: SyntenySection) => {
  const basePairPos = getBasePairPositionFromSVG(event, blockSection.posY1, blockSection.posY2, blockSection.speciesStart, blockSection.speciesStop);
  basePairPositionLabel.value = Formatter.convertBasePairToLabel(basePairPos) || '';
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

.ortholog-line
{
  stroke-width: 1;
  &:hover
  {
    stroke-width: 2.5;
  }
}

.level-2
{
  filter: brightness(60%);
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