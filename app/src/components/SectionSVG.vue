<template>
  <template v-if="showStartStop && region.gaplessBlock.startLabel.isVisible">
    <OverviewSyntenyLabelsSVG :gapless-block="region.gaplessBlock"/>
  </template>
  <template v-for="(blockSection, index) in level1Blocks" :key="index">
    <rect
      class="block-section"
      @mouseenter="onMouseEnter(blockSection, 'trackSection')"
      @mouseleave="onMouseLeave(blockSection, 'trackSection')"
      @click="selectOnClick ? onSectionClick(blockSection, 'trackSection') : () => {}"
      :y="blockSection.posY1"
      :x="blockSection.posX1"
      :width="blockSection.width"
      :height="blockSection.height"
      :fill="getSectionFill(blockSection)"
      :fill-opacity="1"
    />

    <ChromosomeLabelSVG v-if="showChromosome" :synteny-section="blockSection" />
  </template>

  <!-- Detailed Panel Synteny Postion Labels -->
  <template v-if="region.gaplessBlock.posY1 < PANEL_SVG_START && region.gaplessBlock.posY2 > PANEL_SVG_START">
    <text
      class="label small"
      :x="region.gaplessBlock.posX1 - 5"
      :y="PANEL_SVG_START + 10"
    >
      {{ calculateSectionStartPositionLabel(region.gaplessBlock) }}
    </text>
  </template>
  <template v-if="region.gaplessBlock.posY2 > PANEL_SVG_STOP && region.gaplessBlock.posY1 < PANEL_SVG_STOP">
    <text
      class="label small"
      :x="region.gaplessBlock.posX1 - 5"
      :y="PANEL_SVG_STOP - 10"
    >
      {{ calculateSectionStopPositionLabel(region.gaplessBlock) }}
    </text>
  </template>

  <GapSVG v-for="(gapSection,index) in level1Gaps" :key="index" :gap-section="gapSection" />

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

  <GapSVG v-for="(gapSection,index) in level2Gaps" :key="index" :gap-section="gapSection" />

  <template v-if="region && showSyntenyOnHover">
    <SyntenyLinesSVG v-for="(blockSection, index) in region.syntenyBlocks" :key="index" :synteny-section="blockSection" />
  </template>

  <!-- Genes -->
  <template v-for="(datatrack, index) in datatracks" :key="index">
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


<script lang="ts" setup>
import { watch, onMounted} from 'vue';
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
import BackboneSelection, { SelectedRegion } from '@/models/BackboneSelection';
import OverviewSyntenyLabelsSVG from './OverviewSyntenyLabelsSVG.vue';
import { PANEL_SVG_START, PANEL_SVG_STOP } from '@/utils/SVGConstants';

const HOVER_HIGHLIGHT_COLOR = '#FF7C60';
const SELECTED_HIGHLIGHT_COLOR = '#FF4822';

const store = useStore(key);

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
const datatracks = computed(() => {
  return (props.region.datatrackSections as GeneDatatrack[]);
});

const onMouseEnter = (section: SyntenySection | GeneDatatrack, type: SelectedDataType) => {
  // if ()
    section.isHovered = true;
    
    // If there are selected genes, don't update the selected data panel
    if (store.state.selectedGeneIds.length === 0) {
      const selectedData = new SelectedData(section, type);
      store.dispatch('setSelectedData', [selectedData]);
    }

    if (type === 'Gene') 
    {
      const geneSection = section as GeneDatatrack;
      if (geneSection?.gene)
      {
        highlightGeneLines(geneSection?.gene.rgdId, 'enter');
      }
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

const onSectionClick = (section: VCMapSVGElement, type: SelectedDataType) => {
  const backboneChromose = store.state.chromosome;
  if (backboneChromose && section.backboneSection)
  {
    const startSVGY = section.posY1;
    const stopSVGY = section.posY2;
    const basePairStart = section.backboneSection.start;
    const basePairStop = section.backboneSection.stop;
    const selectedBackboneRegion = new BackboneSelection(new SelectedRegion(startSVGY, stopSVGY - startSVGY, basePairStart, basePairStop), backboneChromose);
    selectedBackboneRegion.generateInnerSelection(basePairStart, basePairStop, store.state.overviewBasePairToHeightRatio);
    store.dispatch('setBackboneSelection', selectedBackboneRegion);
  }
};

const getSectionFill = (section: VCMapSVGElement) => {
  if (section.isSelected) {return SELECTED_HIGHLIGHT_COLOR;}
  if (section.isHovered) {return HOVER_HIGHLIGHT_COLOR;}
  return section.elementColor;
};

const highlightSelections = (selectedGeneIds: number[]) => {
  // Look through the sections and highlight based on selected genes
  datatracks.value.forEach((section) => {
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

  /* // After selecting the sections, check if we should use alt labels
  props.track.geneLabels.forEach((label) => {
    // Only consider geneLabels that are already visible anyway
    if (label.isVisible) {
      // If the main gene for this section is selected, we'll use the normal label
      let useAltLabel = false;
      if (selectedGeneIds.includes(label.section.gene.rgdId)) {
        useAltLabel = false;
      } else { // Otherwise if any selected ids exist in the alt labels, we'll use an alt label
        const altLabelIds = label.section.altLabels.map((label) => label.rgdId);
        if (selectedGeneIds.some((id) => altLabelIds.includes(id))) {
          useAltLabel = true;
        }
      }
      label.section.showAltLabel = useAltLabel;
    }
  }); */
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
  const displayedHeight = section.posY2 - PANEL_SVG_START;
  const basePairPerSVG = Math.abs(section.speciesStop - section.speciesStart) / section.height;
  const labelBasePair = section.isInverted ? section.speciesStart + (displayedHeight * basePairPerSVG) : section.speciesStop - (displayedHeight * basePairPerSVG);
  return Formatter.convertBasePairToLabel(Math.round(labelBasePair));
};

const calculateSectionStopPositionLabel = (section: SyntenySection) => {
  const displayedHeight = PANEL_SVG_STOP - section.posY1;
  const basePairPerSVG = Math.abs(section.speciesStop - section.speciesStart) / section.height;
  const labelBasePair = !section.isInverted ? section.speciesStart + (displayedHeight * basePairPerSVG) : section.speciesStop - (displayedHeight * basePairPerSVG);
  return Formatter.convertBasePairToLabel(Math.round(labelBasePair));
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

</style>